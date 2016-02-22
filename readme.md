# HermesJS

#### HermesJS is a GreaseMonkey script to harvest data from web via javascript console.

HermesJS does web scrapping in "user" mode, running it from your browser - Firefox or Chrome. It gives you extreme flexibilty - you can interfere in the process as it goes - manually or via code. For example: you can manually login/authenticate or enter CAPTCHA to a restricted website, and then run a scrapper job to harvest data. HermesJS is controlled via javascript console. You can run or stop the scrapping process as you to fine-tune something. This is a quick way to harvest data without creating a complex solution and spending extra time on development.

## How to use

HermesJS requires GreaseMonkey extension for Firefox (TamperMonkey for Google Chrome) to be run. 
As you have installed GreaseMonkey and added HermesJS, you would need to define and run a job. 

## Jobs

HermesJS uses jobs to define scrapping tasks. See basic scrapping job below:

```javascript

lm1 = {
        startJob : function( hermes ) {
            hermes.setUrls( links );
            // reset gathered data
            localStorage.setItem('hermes.lm.productUrls', JSON.stringify([]) );
            // console.dir( JSON.parse( localStorage.getItem('hermes.urls') ) );
        },
        
        processScrap : function( hermes ) {
            var links = new Array();
            $('#search-result-items li').each(function(el){
                links.push( $(this).find('a.thumb-link').attr('href') ) ;
            });

            // if anything found, save to the list
            if ( links.length > 0 ) {
                var product_links = JSON.parse( localStorage.getItem('hermes.lm.productUrls') );
                product_links.concat(links);
                localStorage.setItem('hermes.lm.productUrls', JSON.stringify(product_links) );
            }

            return true; // true to continue, false to stop
        },


        // call when job is done
        endJob : function() {
            return true; // true to continue, false to show error
        }
    };
    
    
    
```

Show what the library does as concisely as possible, developers should be able to fi**gure** out **how** your project solves their problem by looking at the code example. Make sure the API you are showing off is obvious, and that your code is short and concise.

## Motivation

A short description of the motivation behind the creation and maintenance of the project. This should explain **why** the project exists.

## Installation

Provide code examples and explanations of how to get the project.

## API Reference

Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live.

## Tests

Describe and show how to run the tests with code examples.

## Contributors

Let people know how they can dive into the project, include important links to things like issue trackers, irc, twitter accounts if applicable.

## License

A short snippet describing the license (MIT, Apache, etc.)
