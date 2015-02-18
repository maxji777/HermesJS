// ==UserScript==
// @name        hermes.bobbi
// @namespace   hermes
// @description 123
// @include     jquery
// @version     1
// @grant       none
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
            percent = Math.round( (this.data.step+1) / this.data.urls.length * 10000 ) / 100 + ' % (' + this.data.step + ' of '+this.data.urls.length+')' ;

        return 'Progress: ' + percent + ' &nbsp;&nbsp;&nbsp; time: '+this.getExecutionTime();
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
        localStorage.setItem( this.storageAlias, JSON.stringify( this.data ) );
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





// #############################################################################################################################################################


window.hermesjobs = {

    // ----------------------------------------------- laura mercier -------------------------------------------------------

    // laura mercier gather product links
    lm1 : {


        startJob : function( hermes ) {

            // grab categories
            var links = new Array();
            $('.menu-category li').each(function(){
                $(this).find('ul.level-3 li').each(function(){
                    var category = {
                        name : $(this).find('a').html(),
                        url : $(this).find('a').attr('href')
                    };
                    links.push(category);
                });
            });

            hermes.setUrls( links );

            // localStorage.setItem('hermes.urls', JSON.stringify(links) );
            // localStorage.setItem('hermes.step', 0);

            // reset gathered data
            localStorage.setItem('hermes.lm.productUrls', JSON.stringify([]) );

            // console.dir( JSON.parse( localStorage.getItem('hermes.urls') ) );

        },




        addLinks : function( links ) {

            var product_links = JSON.parse( localStorage.getItem('hermes.lm.productUrls') );

            console.log( 'links in storage' );
            console.dir( product_links );

            console.log('links found:');
            console.dir(links);

            var exists = false;
            var added = 0;

            for(var i=0; i<links.length; i++) {
                exists = false;
                for(var j=0; j<product_links.length; j++) {
                    if ( product_links[j] == links[i] ) {
                        exists = true;
                        break;
                    }
                }
                if ( exists === false && links[i] !== null && links[i] != '' ) {
                    product_links.push( links[i] );
                    added++;
                }
            }

            // product_links = product_links.concat(links);
            console.log('added ' + added + ' links');

            localStorage.setItem('hermes.lm.productUrls', JSON.stringify(product_links) );

        },



        processScrap : function( hermes ) {
            var links = new Array();
            $('#search-result-items li').each(function(el){
                links.push( $(this).find('a.thumb-link').attr('href') ) ;
            });

            // if anything found, save to the list
            if ( links.length > 0 ) {

                this.addLinks(links);

            } else {
                console.log('no links found here');
            }

            return true; // true to continue, false to stop
        },


        // call when job is done
        endJob : function() {
            return true; // true to continue, false to show error
        }


    },









    // laura mercier gather product links
    lm2 : {


        startJob : function( hermes ) {

            // prereq links from job1
            var product_links = JSON.parse( localStorage.getItem('hermes.lm.productUrls') );

            if (product_links.length == 0) {
                console.log('no links from first job, please run 1st job first');
                return false;
            }

            hermes.setUrls( product_links );

            // reset gathered data
            // localStorage.setItem('hermes.lm.productUrls', JSON.stringify([]) );
        },



        processScrap : function( hermes ) {

            var product = {
                name : $('h1.product-name').html(),
                short_description : $('div.shortDescription').html(),
                description : $('div#details').html(),
                usage : $('#usage').html(),
                ingredients : $('#ingredients').html(),
                image : $('img.primary-image').attr('src'),
                category : $('.breadcrumb span.last').html(),
                category_path : $('.breadcrumb').text(),
                price : $('.product-price span').html()
            } ;


            // get swatches
            if ($('div.product-variations').length > 0
                && $('div.product-variations ul li.attribute .horizontal .textDiv').text().toLowerCase().indexOf('color')>0 ) {

                window.swatches = [] ;

                $('div.product-variations ul.swatches.Color li').each(function(){
                    if ( $(this).find('a.swatchanchor').length > 0 ) {
                        var swatch = JSON.parse( $(this).find('a.swatchanchor').attr('data-lgimg')  );
                        swatch.name = $(this).find('.colorName').text();
                        swatch.color = $(this).find('a.swatchanchor').css('backgroundColor');
                        swatch.description = $(this).find('.tooltip-content .variation-tooltip-description p.value').text();
                        swatches.push( swatch );
                    }
                });
                // console.dir(window.swatches);
                console.log( swatches.length + ' swatches found for the product .. ' );
                product.swatches = window.swatches;
            }


            // get sizes
            if ($('div.product-variations').length > 0
                && $('div.product-variations ul li.attribute .horizontal .textDiv').text().toLowerCase().indexOf('size')>0
            ) {
                var sizes = [];
                $('div.product-variations ul li.attribute div.value ul.swatches.size li').each(function(){
                    if ( $(this).find('a.swatchanchor').length > 0 ) {
                        sizes.push( $(this).find('a.swatchanchor').text() );
                    }
                });
                // console.dir(sizes);
                product.sizes = sizes;
            }



            // save product in database
            $.ajax({
                type:"POST",
                url:'http://www.naimies.com/_/batchin.php',
                data: {
                    lmitem : JSON.stringify( product )
                },
                success : function(data) {
                    console.log(data);
                    // alert(data);

                    window.hermes.processScrapCallback();
                    // console.log(  );

                }
            });


            return false; // true to continue, false to stop
            // false cause of success callback
        },


        // call when job is done
        endJob : function( hermes ) {
            return true; // true to continue, false to show error
        }

    },










    // --------------------------------------------------- nyx --------------------------------------------------------


    nyx1 : {

        data : {
            page : 1,
            expectingAjax : false,
            ajaxTimeout : 0
        },

        storageAlias : 'hermes.nyx.',

        startJob : function ( hermes ) {


            localStorage.setItem((this.storageAlias+'productUrls'), JSON.stringify([]) );

            var category_links = [];
            $('div#header ul#nav > li').each(function(){
                if ( $(this).attr('id') != 'whats-new' ) {

                    var parent_category = $(this).children('a:first').text() + ' / ';

                    // category_links.push( $(this).find('a').attr('href') );
                    $(this).find('div.subnav ul li').each( function() {
                        if ( $(this).find('a').length > 0 ) {
                            var linkobj = {
                                url : $(this).find('a').attr('href'),
                                category_path : parent_category + $(this).find('a').text(),
                                category : $(this).find('a').text()
                            };
                            category_links.push( linkobj ) ;
                        }
                    });

                } else {
                    console.log('whats - new .. ');
                }
            });

            hermes.setUrls( category_links ) ;
            return true;
        },



//        initJob : function( hermes ) {
//            hermes.log('init job .. adding nyxAjaxCallback ..');
//            var me = this;
//            hermes.addXMLRequestCallback(function(){
//                me.nyxAjaxCallback( hermes );
//            });
//
//        },


        addCurrentCategoryProductLinks : function() {
            var links = [];
            $('div#productResults > div.productResult').each(function(){
                if ( $(this).find('.productResultImage a').length > 0 ) {
                    var url = $(this).find('.productResultImage a').attr('href');
                    if ( url.indexOf('http') == -1 ) {
                        url = window.location.origin + url;
                    }

                    var linkobj = {
                        url : url,
                        category : window.hermes.getRawUrl().category,
                        category_path : window.hermes.getRawUrl().category_path
                    };

                    links.push( linkobj );
                }
            });
            this.addLinks(links);
        },





        addLinks : function( links ) {

            var product_links = JSON.parse( localStorage.getItem((this.storageAlias+'productUrls')) );

            console.log( 'links in storage' );
            console.dir( product_links );

            console.log('links found:');
            console.dir(links);

            var exists = false;
            var added = 0;

            for(var i=0; i<links.length; i++) {
                exists = false;
                for(var j=0; j<product_links.length; j++) {

                    var value1;
                    if (typeof product_links[j] == 'object') {
                        value1 = product_links[j].url;
                    } else {
                        value1 = product_links[j];
                    }

                    var value2;
                    if ( typeof links[i] == 'object' ) {
                        value2 = links[i].url;
                    } else {
                        value2 = links[i];
                    }

                    if ( value1 == value2 ) {
                        exists = true;
                        break;
                    }
                }
                if ( exists === false && value2 !== null && value2 != '' ) {
                    product_links.push( links[i] );
                    added++;
                }
            }

            // product_links = product_links.concat(links);
            window.hermes.log('added ' + added + ' links');

            localStorage.setItem((this.storageAlias+'productUrls'), JSON.stringify(product_links) );

        },


//        nyxAjaxCallback : function( hermes ) {
//            // hermes.log('nyx ajax callback .. ');
//            if ( this.data.expectingAjax ) {
//                // this.data.page
//                var current = $('div#tribPageRight div#tribPagingTop ul.tribPaging li.pagingCurrent').text();
//                // check if this is valid ajaxCallback
//                if ( this.data.page == current ) {
//                    hermes.log('ajaxCallback .. current page (' + current + ') matches expected, going to next one ..');
//                    this.addCurrentCategoryProductLinks();
//                    this.processScrapAjaxMultipageNext( hermes );
//                } else {
//                    hermes.log('ajaxCallback .. unmatched request, condition [ hermes page ('+this.data.page+') != (' +current+ ') current page from dom ] is not met by callback');
//                }
//            } else {
//                hermes.log('ajaxCallback .. not expecting ajax');
//            }
//        },




        processScrap : function( hermes ) {


            // if single page
            if ( $('div#tribPageRight div#tribPagingTop ul.tribPaging').length == 0 ) {
                hermes.log('this is single page ... ');
                // just grab product urls and add to
                this.addCurrentCategoryProductLinks();
                return true; // go to next url

            } else {
                hermes.log('this is multipage ... ');
                // multi page
                this.processScrapAjaxMultipage(hermes);

                return false; // cause there will be ajax requests
            }


            // return true;
            // if returns false,
            // window.hermes.processScrapCallback() is necessary to continue batch
        },


        processScrapAjaxMultipage : function( hermes ) {

            hermes.log('process scrap multipage ..');
            // grab this page of products
            this.addCurrentCategoryProductLinks();
            this.processScrapAjaxMultipageNext(hermes);

        },


        processScrapAjaxMultipageNext : function( hermes ) {
            hermes.log( 'multipage next ...' );
            // if next page is available
            if ( $('div#tribPageRight div#tribPagingTop ul.tribPaging li:last a').length > 0 ) {
                // this.data.expectingAjax = true;
                this.data.page ++;

                $('div#tribPageRight div#tribPagingTop ul.tribPaging li:last a').click();

                this.waitForNextPage( hermes );
            } else {
                hermes.log('no next button, this category is scanned .. ');
                // go to next url, this is scanned
                hermes.processScrapCallback();
            }
        },

        waitForNextPage : function( hermes ) {
            this.data.ajaxTimeout = 0;
            this.waitForNextPageCallback(hermes);
        },

        waitForNextPageCallback : function( hermes ) {
            var current = $('div#tribPageRight div#tribPagingTop ul.tribPaging li.pagingCurrent').text();
            if ( this.data.page == current ) {
                hermes.log('page ' + current + ' matches expected, going to next one ..');
                this.addCurrentCategoryProductLinks();
                this.processScrapAjaxMultipageNext( hermes );
            } else {

                this.data.ajaxTimeout += hermes.jobAjaxTimeInterval;

                if ( this.data.ajaxTimeout > hermes.jobAjaxTimeout ) {
                    hermes.log('ajax wait time went over ' + hermes.jobAjaxTimeout + ', stopping ..' );
                    hermes.processScrapCallback(); // continue next url
                    return;
                }

                hermes.log('page ('+this.data.page+') != (' +current+ ') dom page, waiting another '+hermes.jobAjaxTimeInterval+'ms .. ');
                var me = this;
                window.setTimeout( function(){ me.waitForNextPageCallback(hermes); }, hermes.jobAjaxTimeInterval );
            }
        },


        endJob : function( hermes ) {
            hermes.log( 'nyx1 job ended.' );
            return true;
        }


    },


    nyx2 : {

        // gather and set list of urls to walk thru
        startJob : function ( hermes ) {

            // prereq links from job1
            var product_links = JSON.parse( localStorage.getItem('hermes.nyx.productUrls') );

            if (product_links.length == 0) {
                console.log('no links from first job, please run 1st job first');
                return false;
            }

            hermes.setUrls( product_links );

            return true;
        },


        // [optional] initJob : run before processScrap
        initJob : function( hermes ) {
            return true;
        },

        // execute to harvest info from a page
        processScrap : function( hermes ) {

            var product = {
                name : $('#product-description h1').text(),
                description : $('#description-content').html(),
                performance : $('#performance-content').html(),

                image : $('#product-image a.product-img-lnk').attr('href'),
                ingredients : $('#ingredients-content').html(),

                category        : hermes.getRawUrl().category ,
                category_path   : hermes.getRawUrl().category_path ,
                price : hermes.extractNumber( $('#price').html() )
            } ;

            // product.images = [];
            // $('#product-image > div > img').each(function(){
            //    if ($(this).css('width') > 5) {
            //        product.images.push( $(this).attr('onclick')  );
            //    }
            //});
            // console.dir(product);

            if ( $('#selections').is(':visible') ) {
                // there are swatches
                var swatches = [];
                $('#selections div.swatch').each(function(){

                    swatches.push({
                        name      : $(this).find('.variant-description').text(),
                        thumb_alt : $(this).find('img').attr('alt'),
                        thumb_url : $(this).find('img').attr('src'),
                        image     : 'http://nyxcdnlive.taylorpond.com/images/variant/medium/' + $(this).find('img').attr('id').replace('ProductPic','') + '.jpg',
                        price     : $(this).find('img').attr('data-price')
                    });

                });
                product.swatches = swatches;
            }

            // console.dir(product);

            // save product in database
            $.ajax({
                type:"POST",
                url:'http://www.naimies.com/_/batchin.php',
                data: {
                    nxitem : JSON.stringify( product )
                },
                success : function(data) {
                    hermes.log(data);
                    // alert(data);

                    window.hermes.processScrapCallback();
                    // console.log(  );

                }
            });



            return false;
            // if returns false,
            // window.hermes.processScrapCallback() is necessary to continue batch
        },

        endJob : function( hermes ) {
            hermes.log('nyx2 job finished');
            return true;
        }


    },



    // -------------------------------------------------- bobbi ---------------------------------------------------------------------



    // bobbi brown gather product links
    bb1 : {


        startJob : function( hermes ) {

            var category_links = [];
            var cat1, cat2;
            $('nav.site-nav div.field-menu > div.menu > ul:eq(0)').children('li').each(function(){
                cat1 = $(this).children('a.menu__link:first').text();
                if( $(this).children('div.menu').length > 0 ) {
                    $(this).children('div.menu').children('ul:first').children('li').each(function(){
                        cat2 = $(this).children('span.menu__link:first').text();
                        $(this).find('a.menu__link').each(function(){
                            var linkobj = {
                                url : $(this).attr('href'),
                                category : $(this).text(),
                                category_path : cat1 + ' / ' + cat2 + ' / ' + $(this).text()
                            };
                            category_links.push( linkobj );
                        });
                    });
                }
            });
            console.log(category_links);



            hermes.setUrls( category_links );

            // localStorage.setItem('hermes.urls', JSON.stringify(links) );
            // localStorage.setItem('hermes.step', 0);

            // reset gathered data
            localStorage.setItem('hermes.bb.productUrls', JSON.stringify([]) );

            // console.dir( JSON.parse( localStorage.getItem('hermes.urls') ) );

        },




        addLinks : function( links ) {

            var product_links = JSON.parse( localStorage.getItem('hermes.bb.productUrls') );

            console.log( 'links in storage' );
            console.dir( product_links );

            console.log('links found:');
            console.dir(links);

            var exists = false;
            var added = 0;

            for(var i=0; i<links.length; i++) {
                exists = false;
                for(var j=0; j<product_links.length; j++) {
                    if ( product_links[j] == links[i] ) {
                        exists = true;
                        break;
                    }
                }
                if ( exists === false && links[i] !== null && links[i] != '' ) {
                    product_links.push( links[i] );
                    added++;
                }
            }

            // product_links = product_links.concat(links);
            console.log('added ' + added + ' links');

            localStorage.setItem('hermes.bb.productUrls', JSON.stringify(product_links) );

        },



        processScrap : function( hermes ) {

            console.log('bb processScrap..');


            if ( typeof window.page_data['catalog-mpp'] != 'undefined' ) {

                var products = [];
                var p,s;

                for(var i=0; i<window.page_data['catalog-mpp'].categories[0].products.length; i++) {

                    p = window.page_data['catalog-mpp'].categories[0].products[i];
                    console.log('var product = ');
                    var product = {
                        name : p.PROD_RGN_NAME,
                        description : p.DESCRIPTION,
                        category_path : hermes.data.urls[hermes.data.step].category_path,
                        display_status : p.DISPLAY_STATUS,
                        formula : p.FORMULA,
                        family_code : p.FAMILY_CODE,
                        avg_rating : p.AVERAGE_RATING,
                        skintype : p.ATTRIBUTE_SKINTYPE,
                        coverage : p.ATTRIBUTE_COVERAGE,
                        benefit : p.ATTRIBUTE_BENEFIT,
                        images : p.IMAGE_XXL,
                        parent_cat_id : p.PARENT_CAT_ID,
                        usage : p.PRODUCT_USAGE,
                        product_id  : p.PRODUCT_ID,
                        recommended_count : p.RECOMMENDED_COUNT,
                        recommended_percent : p.RECOMMENDED_PERCENT,
                        review_count : p.TOTAL_REVIEW_COUNT,
                        default_sku : p.defaultSku.SKU_BASE_ID,
                        price : p.defaultSku.PRICE,
                        is_palette : p.IS_PALETTE,
                        is_shoppable : p.isShoppable,
                        url : p.url,
                        worksWith : p.worksWith,
                        skus : []
                    };

                    console.log('processing skus .. ');

                    for(var j=0; j<p.skus.length; j++) {

                        s = p.skus[j];

                        var sku = {
                            color_family : s.ATTRIBUTE_COLOR_FAMILY,
                            display_order : s.DISPLAY_ORDER,
                            display_status : s.DISPLAY_STATUS,
                            finish : s.FINISH,
                            hex : s.HEX_VALUE_STRING,
                            smoosh : s.IMAGE_SMOOSH_XL,
                            inventory_status : s.INVENTORY_STATUS,
                            life : s.LIFE_OF_PRODUCT,
                            price : s.PRICE,
                            product_code : s.PRODUCT_CODE,
                            size : s.PRODUCT_SIZE,
                            refillable : s.REFILLABLE,
                            shade_name : s.SHADENAME,
                            shade_description : s.SHADE_DESCRIPTION,
                            sku_id : s.SKU_ID,
                            smoosh_design : s.SMOOSH_DESIGN,
                            is_shoppable : s.isShoppable
                        };

                        product.skus.push(sku);

                    }

                    products.push(product);

                }

                console.log('..harvested, posting data..');

                // save product in database
                $.ajax({
                    type:"POST",
                    url:'http://www.naimies.com/_/scripts/bb.php',
                    data: {
                        a : 'harvest',
                        products : JSON.stringify( products )
                    },
                    success : function(data) {
                        hermes.log(data);
                        // alert(data);

                        window.hermes.processScrapCallback();
                        // console.log(  );

                    }
                });

            } else if ( typeof window.page_data['product-input-type'] != 'undefined' ) {


                var products = [];
                var p,s;

                for(var i=0; i<window.page_data['product-input-type'].products.length; i++) {

                    p = window.page_data['product-input-type'].products[i];
                    console.log('var product = ');
                    var product = {
                        name : p.PROD_RGN_NAME,
                        description : p.DESCRIPTION,
                        category_path : hermes.data.urls[hermes.data.step].category_path,
                        display_status : p.DISPLAY_STATUS,
                        formula : p.FORMULA,
                        family_code : p.FAMILY_CODE,
                        avg_rating : p.AVERAGE_RATING,
                        skintype : p.ATTRIBUTE_SKINTYPE,
                        coverage : p.ATTRIBUTE_COVERAGE,
                        benefit : p.ATTRIBUTE_BENEFIT,
                        images : p.IMAGE_XXL,
                        parent_cat_id : p.PARENT_CAT_ID,
                        usage : p.PRODUCT_USAGE,
                        product_id  : p.PRODUCT_ID,
                        recommended_count : p.RECOMMENDED_COUNT,
                        recommended_percent : p.RECOMMENDED_PERCENT,
                        review_count : p.TOTAL_REVIEW_COUNT,
                        default_sku : p.defaultSku.SKU_BASE_ID,
                        price : p.defaultSku.PRICE,
                        is_palette : p.IS_PALETTE,
                        is_shoppable : p.isShoppable,
                        url : p.url,
                        worksWith : p.worksWith,
                        skus : []
                    };

                    console.log('processing skus .. ');

                    for(var j=0; j<p.skus.length; j++) {

                        s = p.skus[j];

                        var sku = {
                            color_family : s.ATTRIBUTE_COLOR_FAMILY,
                            display_order : s.DISPLAY_ORDER,
                            display_status : s.DISPLAY_STATUS,
                            finish : s.FINISH,
                            hex : s.HEX_VALUE_STRING,
                            smoosh : s.IMAGE_SMOOSH_XL,
                            inventory_status : s.INVENTORY_STATUS,
                            life : s.LIFE_OF_PRODUCT,
                            price : s.PRICE,
                            product_code : s.PRODUCT_CODE,
                            size : s.PRODUCT_SIZE,
                            refillable : s.REFILLABLE,
                            shade_name : s.SHADENAME,
                            shade_description : s.SHADE_DESCRIPTION,
                            sku_id : s.SKU_ID,
                            smoosh_design : s.SMOOSH_DESIGN,
                            is_shoppable : s.isShoppable
                        };

                        product.skus.push(sku);

                    }

                    products.push(product);

                }

                console.log('..harvested, posting data..');

                // save product in database
                $.ajax({
                    type:"POST",
                    url:'http://www.naimies.com/_/scripts/bb.php',
                    data: {
                        a : 'harvest',
                        products : JSON.stringify( products )
                    },
                    success : function(data) {
                        hermes.log(data);
                        // alert(data);

                        window.hermes.processScrapCallback();
                        // console.log(  );

                    }
                });


            }



            return false; // true to continue, false to stop
        },


        // call when job is done
        endJob : function() {
            return true; // true to continue, false to show error
        }


    }






}





window.hermes.boot();


// #######################################################################################################################################################################
// hermes.reset()
// hermes.addJob('lm1');
// hermes.start()

// - or -

// hermes.startJob('nyx1');


