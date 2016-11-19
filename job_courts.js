
window.hermesjobs = {
    
    c1 : {
    
    
    /* hermes : {
        isArray : function(a) { return Array.isArray(a); },
        x : function() { alert('x'); },
        log : function(a) { console.log(a); },
        getUrl : function() { return 'http://map.aaaa.bbb.ccc/31234' }
    }, */
        
    name : 'court harvest',
    
    data : {
        startId : 28545,
        endId : 33561,        
        fields : [
           //  { name : 'name', selector: 'h2 a', value : 'text' }, // value : [ text, html, attr[attribute:[attr]] ]
        ]        
    },
    
    storageAlias : 'hermes.courts.data',
    
    addField : function(name, selector, value, extra) {
        
        // this.hermes.log('adding field: ' + name);
        
        if ( this.hermes.isArray( name ) ) {
            for (var i=0; i<name.length; i++) {
                var n = name[i];
                this.addField( n[0], n[1], n[2], typeof n[3] != 'undefined' ? n[3] : null );
            }
        } else {
            this.data.fields.push({ 
                    name: name, 
                    selector: selector,
                    value: value,
                    extra: extra
                });
        }        
    },
    
    initJob : function(hermes) {
        
        // hermes.log('init job aaa');
        // hermes.log('bbba');
        
        
        hermes.log('reset fields');
        hermes.harvesting.resetFields();
        
        hermes.log('add fields');
        
        hermes.harvesting.addField([
            
            ['name', 'h2 a', 'text'],
            ['details_link', 'h2 a', 'href'],
            ['court_type', 'div.field.field-name-field-court-type ul.links li', 'mapJoin', function(){ return $(this).text(); } ],
            ['counties', 'div.field.field-name-field-counties-served div.field-item', 'mapJoin', function() { return $(this).text(); } ],
            
            ['address', 'div.field.field-name-field-full-address.field-type-addressfield div.field-items div.street-block', 'text'],
            ['city', 'div.field.field-name-field-full-address.field-type-addressfield div.field-items span.locality', 'text'],
            ['state', 'div.field.field-name-field-full-address.field-type-addressfield div.field-items span.state', 'text'],
            ['zip', 'div.field.field-name-field-full-address.field-type-addressfield div.field-items span.postal-code', 'text'],
            
            ['coordinator_title', 'div.field.field-name-field-coordinator-title div.field-items', 'text'],
            ['coordinator_first', 'div.field.field-name-field-coordinator-first-name div.field-items', 'text'],
            ['coordinator_last', 'div.field.field-name-field-coordinator-last-name div.field-items', 'text'],
            ['coordinator_phone', 'div.field.field-name-field-coord-phone div.field-items', 'text'],
            
            ['teaser_id', null, 'function', 
                function(job) { 
                    var url = job.hermes.getUrl(); 
                    return url.substring(url.length-5); 
                }]
            
        ]);
        
        return true;
    }, 
    
    
    harvestFields : function() {
        
        var item = {};
        
        for(var i=0; i<this.data.fields.length; i++) {
            
            var field = this.data.fields[i];
            var value = null;
            
            // log
            // this.hermes.log('field: ' + field.name);
            
            if (field.selector === null) {
                if ( field.value == 'function' ) {
                    if (typeof field.extra == 'function') {
                        value = field.extra(this);
                    } else {
                        this.hermes.log('FATAL: invalid field config ['+i+'] (' +field.name+ '), value is function, extra is not');
                        this.hermes.x(); // stop, fatal error    
                    }
                    
                } else {
                    this.hermes.log('FATAL: invalid field config ['+i+'] (' +field.name+ ')');
                    this.hermes.x(); // stop, fatal error
                }
            } else {
                // selector based
                var elem = $(field.selector);
                if (elem.length) {
                    
                    // if element exists
                    switch(field.value) {
                        case 'text' : value = elem.text(); break;
                        case 'href' : value = elem.attr('href'); break;
                        case 'attr' : value = elem.attr(field.extra); break;
                        case 'mapJoin' : value = elem.map(field.extra).get().join(); break;
                        default : 
                            this.hermes.log('FATAL: field config ['+i+'] ('+field.name+'), field.value is not supported: ' + field.value);
                            this.hermes.x();                            
                    }                    
                    
                } else {
                    this.hermes.log('WARNING: field ['+i+'] ('+field.name+') selector did not match any element');
                }
            }
            
            item[field.name] = value;
        }
        
        return item;
    },
    

    
    startJob : function( hermes ) {

        // grab categories
        var links = new Array();
        var j = 0;
        for (var i=this.data.startId; i<=this.data.endId; i++) {
            links.push( 'http://map.nadcp.org/teaser/court/' + i );
            
            
            // 5 links
            // j++;
             //  if (j>5) { break; }
            
        }
        
        console.log(links);
        
        hermes.setUrls(links);

        // reset gathered data
        localStorage.setItem(this.storageAlias, JSON.stringify([]) );

    },

    processScrap : function( hermes ) {
         
         var court = hermes.harvesting.harvestFields(); 
         
         /* = {
                name : '',
                court_type : '',
                counties: '',
                teaser_id : '',
                details_link : '',
                
                address : '',
                city : '',
                state : '',
                zip : '',
             
                coordinator_title : '',
                coordinator_first : '',
                coordinator_last : '',
                coordinator_phone : ''
            };*/ 
          
         // hermes.log('harvesed');
         // hermes.log(court);
         // save 
         var data =  JSON.parse( localStorage.getItem(this.storageAlias) ) ;
         data.push(court);
         localStorage.setItem(this.storageAlias, JSON.stringify(data));
        
        
           // save product in database
           $.ajax({
                type:"POST",
                url:'https://drugtestsinbulk.com/_hrv/harvest.php',
                data: {
                    request: 'save-court',
                    court : JSON.stringify( court )
                },
                success : function(data) {
                    hermes.log(data);
                    window.hermes.processScrapCallback();
                }
            });
        

         return false; // true to continue, false to stop
     },


     // call when job is done
     endJob : function() {
         return true; // true to continue, false to show error
     }


}
    
};
