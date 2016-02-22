# HermesJS

#### HermesJS is a GreaseMonkey script to automate data harvesting in browser via console.

HermesJS does web scrapping in "user" mode, running it from your browser - Firefox or Chrome. It gives you extreme flexibilty - you can interfere in the process as it goes - manually or via code. For example: you can manually login/authenticate or enter CAPTCHA to a restricted website, and then run a scrapper job to harvest data. Or perform multi-step job, like first harvesting the links, and then going thru links to capture data. 

HermesJS is controlled via javascript console. You can run or stop the scrapping process as you need to fine-tune something. This is a quick and easy way to harvest data without creating a complex solution and spending extra time on development.

## Requirements

- Mozilla Firefox or Google Chrome 
- [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (for Firefox) or [TamperMonkey](https://tampermonkey.net/) (for Chrome)


## How to use

Install GreaseMonkey (or TamperMonkey). Add HermesJS. You would need to define and run a job. 

## Creating Jobs

HermesJS uses jobs to define scrapping tasks. See basic scrapping job below:

```javascript

sampleJob = {

        // stuff to do before job start
        startJob : function( hermes ) {

            // list of urls to walk thru
            var links = [
                { name:'1', url:'http://www.yahoo.com' },
                { name:'2', url:'http://www.aol.com' }
            ];
            
            hermes.setUrls( links );
        },
        
        // processScrap runs on every page HermesJS walks thru
        processScrap : function( hermes ) {
        
            // grap page title
            var title = $('h1').text();
            
            // return true to continue to next step
            // or false to stop the process on current url (if data scrapping failed or element not found)
            return true; 
        },


        // call when job is done
        endJob : function() {
        
            // $.ajax('save data to to database', data);
        
            return true; // true to continue, false to show error
        }
    };
```

Then, add job in javascript console.

```javascript
hermes.addJob(sampleJob);
```



## Installation

Provide code examples and explanations of how to get the project.

## API Reference

Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live.

## License

A short snippet describing the license (MIT, Apache, etc.)
