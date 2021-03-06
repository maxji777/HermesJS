# HermesJS 
##### v 1.4.4

#### HermesJS is a GreaseMonkey script to automate data harvesting in browser via console.

HermesJS does web scrapping in "user" mode, running it from your browser - Firefox or Chrome. It gives you extreme flexibilty - you can interfere in the process as it goes - manually or via code. For example: you can manually login/authenticate or enter CAPTCHA to a restricted website, and then run a scrapper job to harvest data. Or perform multi-step job, like first harvesting the links, and then going thru links to capture data. 

HermesJS is controlled via javascript console. You can run or stop the scrapping process as you need to fine-tune something. This is a quick and easy way to harvest data without creating a complex solution and spending extra time on development.

## Requirements

- Mozilla Firefox or Google Chrome 
- [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (for Firefox) or [TamperMonkey](https://tampermonkey.net/) (for Chrome)
- (optional) jQuery or similar for simplicity


## How to use

Install GreaseMonkey (or TamperMonkey). Add HermesJS. You would need to define and run a job. 

### Creating Jobs

Using javascript console, define scrapping jobs. See basic example below:

```javascript

sampleJob = {

        // stuff to do before job starts
        startJob : function( hermes ) {

            // list of urls to walk thru
            var links = [
                { name:'1', url:'http://www.yahoo.com' },       // either as an object
                'http://www.apple.com',                         // or a string
                'http://www.nba.com'
            ];
            
            // tell hermes list of urls to walk thru
            hermes.setUrls( links );

            // create an array where to save data
            // (everything in hermes.data will be saved in localStorage)
            hermes.data.titles = [];
        },
        
        
        
        // processScrap runs on every page HermesJS walks thru
        processScrap : function( hermes ) {
        
            // grap page title
            var title = $('h1').text();
            
            // add page title to our array for saving
            hermes.data.titles.push(title);

            // return true to continue to next url
            // or false to stop the process (if data scrapping failed or element not found)
            return true; 
        },



        // call when job is done
        endJob : function( hermes ) {
        
            // save harvested data to your server database
            $.post({
                url: 'localhost/hermes.php',
                data: {
                    request: 'save_titles',
                    titles : JSON.stringify(hermes.data.titles)
                } 
            });

            // true to continue, 
            // false to show error
            return true; 
        }
    };
```

Then, add and run the job.

```javascript
hermes.addJob(sampleJob);
hermes.start();
```

Or, you can do it in one line:

```javascript
hermes.startJob(sampleJob);
```

### Server-side

Your backend script to capture and save data passed from Hermes. 
In the example: localhost/hermes.php

```php
<?php
// make sure request is not blocked by browser policy
header('Access-Control-Allow-Origin: *');

if (isset($_POST['request']) && $_POST['request'] == 'save_titles') {
    
    $titles = json_decode($_POST['titles'], true);
    foreach($titles as $title) {
        db()->sql('insert into titles set title=?', [ $title ]);
    }
    
    echo json_encode([
        'success' => true
    ]);
        
    exit;
}
```

That's it!

### More Examples

There are more [sample jobs](sample_jobs.js), also they are more complex. Sometimes you need to first walk thru several urls to gather further list of links to harvest info from. I used those jobs to harvest product data with images to import into a local store website. 
