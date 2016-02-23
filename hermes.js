// ==UserScript==
// @name        HermesJS
// @namespace   hermes
// @description Hermes makes web scrapping easy.
// @include     jquery
// @version     1.3.13
// ==/UserScript==

// --- do not run on iframes ---
if (window.top!=window.self) {
    return;
}

// ----------- init ---------------
function __hermes() { window.hermes.init(); }
window.addEventListener('load', __hermes, false);


// ----------------------------- hermes -------------------------------------

window.hermes = {

    version : '1.3.13',

    showVisualStatus    : true,
    storageAlias        : 'hermes.data',
    jobAjaxTimeInterval : 5000, // milliseconds
    jobAjaxTimeout      : 15000,


    data : {
        urls : [],

        // in the job
        step : false,
        isRunning : false,

        jobs : [],
        currentJob : 0,
        jobStarted : null, // when job started

        expectingAjax : false
    },

    configLoaded : false,


    getExecutionTime : function() {
        if ( !this.data.jobStarted )
            return '( not running )';
        return this.formatTimeSeconds( (new Date().getTime() - this.data.jobStarted)/1000 );
    },


    formatTimeSeconds : function(totalSec) {
        var hours = parseInt( totalSec / 3600 ) % 24;
        var minutes = parseInt( totalSec / 60 ) % 60;
        var seconds = totalSec % 60;
        return ( hours ? ( hours < 10 ? "0" + hours : hours ) + 'h ' : '' ) +
            ( minutes < 10 ? "0" + minutes : minutes) + "m " +
            (seconds  < 10 ? "0" + seconds : seconds) + 's';
    },


    getProgress : function() {

        if (!this.data.isRunning)
            return '';

        var percent;
        if ( this.data.urls.length == 0  )
            percent =  'No urls are in the list.';
        else
            percent = Math.round( (this.data.step+1) / this.data.urls.length * 10000 ) / 100 
                + ' % (' + this.data.step + ' of '+this.data.urls.length+')' ;

        return 'Progress: ' + percent + ' &nbsp;&nbsp;&nbsp; time: ' + this.getExecutionTime();
    },


    log : function( msg ) {
        console.log(msg);
        if ( this.showVisualStatus )
            $('#hermes-console').html( $('#hermes-console').html() + "<br />" + msg );
    },


    // --------------------- job interface -----------------------

    jobInterface : {

        // gather and set list of urls to walk thru
        startJob : function ( hermes ) {
            return true;
        },


        // [optional] initJob : run before processScrap
        initJob : function( hermes ) {
            return true;
        },

        // execute to harvest info from a page
        processScrap : function( hermes ) {
            return true;
            // if returns false,
            // window.hermes.processScrapCallback() is necessary to continue batch
        },

        endJob : function( hermes ) {
            return true;
        }

    },




    // -------------- config ------------
    saveConfig : function() {
        localStorage.setItem( this.storageAlias, JSON.stringify(this.data) );
    },

    loadConfig : function() {
        // load data from localStorage
        var s = localStorage.getItem(this.storageAlias);
        if ( s !== null ) {
            this.data = JSON.parse(s);
            return true;
        }
        return false;
    },

    reset : function() {
        this.data = {
            urls : [],

            // in the job
            step : false,
            isRunning : false,

            jobs : [],
            currentJob : 0
        };

        this.saveConfig();
    },

    clear : function() {
        return this.reset();
    },


    x : function() {
        localStorage.setItem('hermes.stopRequested', true);
    },

    xc : function() {
        localStorage.removeItem('hermes.stopRequested');
    },



    // --------- boot: starts as script loads ---------
    boot : function() {

        var lines = [];
        lines.push( 'hermes/'+this.version );

        if (this.configLoaded && this.data.isRunning)
            lines.push( this.getProgress() );

        for(var i=0;i<lines.length;i++)
            console.log(lines[i]);

        if (!this.configLoaded)
            this.configLoaded = this.loadConfig();

        if ( this.showVisualStatus )
            $("body").append( "<div id='hermes-console' style='"+
            "position:absolute;font-family:lucida sans unicode;font-size:12px;left:0;top:0;background-color:red;color:white;padding:3px"+
            "'>"+lines.join('<br />')+"</div>" );

        if (this.data.isRunning) {
            this.log( 'URL: ' + this.getUrl() );
            this.log( this.getProgress() );
        }

    },




    // ---------------- init -------------------
    init : function() {
        console.log('hermes init');
        if(this.configLoaded) {

            if ( this.data.isRunning ) {
                console.log('work in progress ..');
                console.log( this.getProgress() );
                // scrapping session is running
                console.log('..initCurrentJob..');
                this.initCurrentJob();

                console.log('..processScranCurrentJob..');
                // harvest info on the current page
                if (this.processScrapCurrentJob()) {
                    // goto next url
                    this.gotoNextUrl();
                }
                // else wait for job to call hermes.processScrapCallback()



            } else {
                console.log('not running, you can start by calling hermes.start()');
            }


        } else {
            this.reset(); // populate empty config
            console.log('no config in localStorage');
        }
        // if ( this.isRunning )
        // this.continueScrapping();
    },


    gotoNextUrl : function () {
        this.data.step ++;
        if ( !this.isStopRequested() ) // this.data.step < 3 )
            this.continueNext();
        else
            this.log('stopping .. stopRequested flag detected .. ');
    },


    listJobs : function() {
        console.dir(this.data.jobs);
    },

    displayData : function() {
        console.dir(this.data);
    },


    getJob : function( name ) {

        if (typeof name=='undefined') {
            // get current job
            name = this.data.jobs[ this.data.currentJob ];
        }
        if ( typeof window.hermesjobs[ name ] != 'object' ) {
            console.log('cannot get the job ' + name + ' does not exist in hermesjobs object');
            return false;
        }
        return window.hermesjobs[ name ];
    },



    addJob : function(job) {
        if ( typeof job != 'string' ) {
            this.log('cannot add job cause its not string');
            return false;
        }
        if ( typeof window.hermesjobs[ job ] != 'object' ) {
            this.log('the job ' + job + ' does not exist in hermesjobs object');
            return false;
        }
        this.data.jobs.push(job);
        this.saveConfig();
        this.log('job added: ' + job);
        return true;
    },

    setUrls : function( urls ) {
        this.data.urls = urls;
    },

    // getUrls : function() {
    //    return this.data.urls;
    // },

    start : function() {
        if ( this.data.isRunning ) {
            // continue next item
            this.continueNext();
        } else {
            this.data.isRunning = true;
            if ( this.data.jobs.length > 0 ) {
                this.data.currentJob = -1; // cause nextJob will add +1
                this.nextJob();
            } else {
                this.log('no jobs added, nothing to run');
                this.data.isRunning = false;
            }
        }
    },


    // quickly start a job
    startJob : function( job ) {
        this.reset();
        // this.xc(); // clear stop on every url
        this.addJob(job);
        this.start();
    },


    getUrl : function( index ) {

        if ( typeof index == 'undefined' )
            index = this.data.step;

        if ( index >= this.data.urls.length ) {
            console.log('accessing index that is out of boundaries');
            return false;
        }

        var urlitem = this.data.urls[ index ];

        if ( urlitem === null )
            return false;

        if (typeof(urlitem)=='object') {
            return urlitem.url;
        } else if (typeof(urlitem) == 'string') {
            return urlitem;
        } else {
            console.log('unknown type of urlitem: ' + typeof(urlitem));
            return false;
        }

    },

    getRawUrl : function( index ) {
        if ( typeof index == 'undefined' )
            index = this.data.step;
        return index !== false && typeof this.data.urls[index] != 'undefined'
            ? this.data.urls[index]
            : null;
    },


    isStopRequested : function() {
        var stop = localStorage.getItem('hermes.stopRequested');
        return ( stop !== null && (stop == true || stop == 'true') ) ;
    },


    continueNext : function() {
        if ( this.data.urls.length <= 0) {
            this.log('cannot continue, cause urls is empty');
            return false;
        }

        // continue
        if ( this.data.step < this.data.urls.length ) {
            var nextUrl = this.getUrl( this.data.step );
            if (nextUrl) {
                // go to next url
                this.saveConfig(); // save state before going to next step
                console.log( this.getProgress() );
                console.log('going to next url: ' + nextUrl);
                // if ( !this.isStopRequested() ) {
                // console.log(' ----- nextUrl commented out ----- ');
                window.location.href = nextUrl;
                // }
            } else {
                // if this url is null, then go to next one
                this.gotoNextUrl();
            }

        } else {
            console.log('job finished');
            this.endCurrentJob();
            this.nextJob();
        }
    },




    finish : function() {
        this.data.isRunning = false;
        this.data.urls = [];
        this.data.step = 0;
        this.saveConfig();
        this.log('all jobs are finished');
    },



    nextJob : function() {

        // time the job
        this.data.jobStarted = new Date().getTime();

        this.data.currentJob ++;

        // reset variables
        this.data.step = 0;
        this.data.urls = [];

        if ( this.data.currentJob >= this.data.jobs.length ) {
            this.finish();
            return true;
        } // if finished


        if ( !this.isCurrentJobValid() )  {
            this.log('cannot continue cause job appers to be in invalid format');
            return false;
        }

        this.startCurrentJob();
        if ( this.data.urls.length > 0 ) {
            this.continueNext();
        } else {
            this.log('startJob added no urls, nothing to crawl, going to next job');
            this.endCurrentJob();
            this.nextJob();
        } // if no urls


    },





    // ----------------- job helpers ---------------------

    isCurrentJobValid : function() {
        var job = this.getJob( this.data.jobs[ this.data.currentJob ] );
        if ( typeof job != 'object' ) {
            console.log('job ' + this.data.jobs[ this.data.currentJob ] + ' is not valid, cause it is not an object');
            return false;
        }
        return true;
    },


    resetCurrentJob : function() {
        this.data.step = 0;
    },


    endCurrentJob : function() {
        var job = this.getJob( this.data.jobs[ this.data.currentJob ] );
        if ( typeof job == 'object' && typeof job.endJob == 'function' ) {
            return job.endJob(this);
        } else {
            console.log('cannot endJob on the job ' + this.data.jobs[ this.data.currentJob ]);
            return false;
        }
    },



    startCurrentJob : function() {
        var job = this.getJob( this.data.jobs[ this.data.currentJob ] );
        if ( typeof job.startJob != 'function' ) {
            this.log('cannot start job ' + this.data.jobs[ this.data.currentJob ] + ' has not startJob function');
            return false;
        } else {
            return job.startJob(this);
        }
    },



    processScrapCurrentJob : function() {
        var job = this.getJob( this.data.jobs[ this.data.currentJob ] );
        if ( typeof job == 'object' && typeof job.processScrap == 'function' ) {
            return job.processScrap(this);
        } else {
            this.log('cannot processScrap on the job ' + this.data.jobs[ this.data.currentJob ]);
            return false; //////////////////
        }
    },


    initCurrentJob : function() {
        var job = this.getJob();
        if (typeof job.initJob == 'function')
            job.initJob(this);
    },



    // called from job to continue for async actions
    processScrapCallback : function() {
        this.gotoNextUrl();
    },

    continue : function() {
        this.gotoNextUrl();
    },



    // ------------------------ helpers -------------------------------

    extractNumber : function( text ) {
        return parseFloat(text.match(/-*[0-9.]+/));
    },


    // ################################ javascript api ##########################################

    addXMLRequestCallback : function(callback){
        var oldSend, i;
        if( XMLHttpRequest.callbacks ) {
            // we've already overridden send() so just add the callback
            XMLHttpRequest.callbacks.push( callback );
        } else {
            // create a callback queue
            XMLHttpRequest.callbacks = [callback];
            // store the native send()
            oldSend = XMLHttpRequest.prototype.send;
            // override the native send()
            XMLHttpRequest.prototype.send = function(){
                // process the callback queue
                // the xhr instance is passed into each callback but seems pretty useless
                // you can't tell what its destination is or call abort() without an error
                // so only really good for logging that a request has happened
                // I could be wrong, I hope so...
                // EDIT: I suppose you could override the onreadystatechange handler though
                for( i = 0; i < XMLHttpRequest.callbacks.length; i++ ) {
                    XMLHttpRequest.callbacks[i]( this );
                }
                // call the native send()
                oldSend.apply(this, arguments);
            }
        }
    }




} ;

window.hermes.boot();


// #######################################################################################################################################################################
// Usage:
// hermes.reset()
// hermes.addJob('lm1');
// hermes.start()
// - or -
// hermes.startJob('nyx1');


