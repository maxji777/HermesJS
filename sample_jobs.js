


// ###########################################  sample jobs  #####################################################

// i wrote these to get info and images for products from some cosmetics websites



jobs = {
  
    // ----------------------------------------------- lauramercier.com -------------------------------------------------------

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
                url:'http://localhost/hermes.php',
                data: {
                    request: 'lauramercier_add_product',
                    lmitem : JSON.stringify( product )
                },
                success : function(data) {
                    hermes.log(data);
                    window.hermes.processScrapCallback();
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







    // --------------------------------------------- nyx cosmetics ----------------------------------------------------


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
                url:'http://localhost/hermes.php',
                data: {
                    request: 'nyx_add_product',
                    nxitem : JSON.stringify( product )
                },
                success : function(data) {
                    hermes.log(data);
                    window.hermes.processScrapCallback();
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



    // ---------------------------------------- bobbi brown --------------------------------------------------

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
                    url:'http://localhost/hermes.php',
                    data: {
                        request : 'bobbi_add_products',
                        products : JSON.stringify( products )
                    },
                    success : function(data) {
                        hermes.log(data);
                        window.hermes.processScrapCallback();
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
                    url:'http://localhost/hermes.php',
                    data: {
                        request : 'add_products',
                        products : JSON.stringify( products )
                    },
                    success : function(data) {
                        hermes.log(data);
                        window.hermes.processScrapCallback();
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

