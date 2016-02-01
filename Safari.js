var page = require('webpage').create();
var system = require('system');
var fs = require('fs');
var stepIndex = 0;
var loadInProgress = false;

var email = system.args[1];
var password = system.args[2];
var bookUrl = system.args[3];
var bookTitle = system.args[4];

var directory = "./" + bookTitle + "/";

page.viewportSize = { width: 1600, height: 800 };
page.zoomFactor = 300.0/72.0;

page.onLoadStarted = function() {
    loadInProgress = true;
    console.log("load started");
};

page.onLoadFinished = function() {
    loadInProgress = false;
    console.log("load finished");
};

generateSteps = function(numPages, steps) {
	console.log("Generating Steps");
	for(var i=0; i<numPages; i++) {
		steps.push(function(){
			document.querySelector('#navbarright').click();
		});
		steps.push(function() {
			page.render(directory + 'page' + i + '.pdf');
		});
	}
};

var steps = [
	function() {
		console.log("Starting...");
		page.open(bookUrl, function(status) {
            page.evaluate(function() {
                document.querySelector("a[title='Sign In']").click();
            });
        });		
	},
	function() {		
		page.evaluate(function(email, password) {
			document.querySelector("input[name='__login']").value = email;
			document.querySelector("input[name='__password']").value = password;

			document.querySelector("#form_456349").submit();

			console.log("Login submitted!");
		}, email, password);
    },
    function() {
        page.render('output.png');
    },
	function() {
		page.evaluate(function() {
			document.querySelector('#fullscreenbtn').click();
		});		
		page.render(directory + 'begin.pdf');
	}
];

var numPages = 3000;
var startIndex = 0;
var pageMap = {};
var currentPage = 1;
var isSaveComplete = true;

for(var i=0; i<numPages; i++) {
	(function(index){
		var actualIndex = startIndex + index;
		steps.push(function(){
			if(isSaveComplete) {
				var href = page.evaluate(function(){
					var href = document.querySelector('#navbarright').href;
					document.querySelector('#navbarright').click();
					return href;
				});	
				console.log("Navigating to " + href);
				isSaveComplete = false;
			}
		});
		steps.push(function() {
			if(!pageMap[page.title]) {
				pageMap[page.title] = true;
				console.log("Saving Page " + currentPage + " --> " + page.title);
				page.render(directory + 'page_' + (currentPage) + '.png', {format: 'png', quality: '70'});	
				
				/*page.viewportSize = { width: 800, height: 800 };
				page.zoomFactor = 1;
				page.render(directory + 'page_' + (currentPage) + '.pdf');*/
				
				//fs.write(directory + 'page_' + (currentPage) + '.html', page.content, 'w');				
				
				currentPage++;				
			
				// Only one entry will be saved in this map, but keeping this structure for future development
				pageMap = {};
				pageMap[page.title] = true;
			
				isSaveComplete = true;			
			}
		});
	})(i);
}

setInterval(function() {
    if (!loadInProgress && typeof steps[stepIndex] == "function") {
        console.log("step " + (stepIndex + 1));
        steps[stepIndex]();
        stepIndex++;
    }
    if (typeof steps[stepIndex] != "function") {
        console.log("test complete!");
		console.log(steps.length);
        phantom.exit();
    }
}, 1000);