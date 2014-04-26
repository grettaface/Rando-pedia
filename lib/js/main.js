var desiredFormat = "json";
var numberOfArticles = 1;
var randomURL = "http://en.wikipedia.org/w/api.php?action=query&rnnamespace=0";
var ls = Modernizr.localstorage

var historyArray = [];

var loading = $("#loading");
var bi = $("#backgroundImage");



if(ls){
   //localStorage['lastPage'] = undefined
}
/**
 * Loads the last page from local storage
 *
 */
function loadHistory() {
   var lastPage = JSON.parse(localStorage['lastPage']);
   if(lastPage.title != undefined){
        getArticleContent(lastPage.title, lastPage.id)
   }else{
       getRandomFeed();
   }
}


function loadBackground(source) {

    if(source != undefined){

        var bgImg = new Image();
        bgImg.onload = function () {
            bi.css({
                backgroundImage:'url(' + bgImg.src + ')',
            });

            // put this on a delay to prevent a flicker when the image changes.
            setTimeout(function(){
                bi.css({
                    opacity:1
                });
            },200)
        };

        bgImg.src = source;
    }
}

/**
 * Gets the feed from Wikipedia
 *
 * @param type
 */
function getRandomFeed(type, title) {

    loading.show();
    loading.css("opacity", 1);

    $.ajax({
        url:randomURL + "&format=" + desiredFormat + "&rnlimit=" + numberOfArticles + "&list=random",
        dataType:"jsonp"  // must be JSONP to prevent cross domain issue
    }).done(function (data) {


            // I have my results
            var articleTitle = data.query.random[0].title;
            var articleId = data.query.random[0].id;

            getArticleContent(articleTitle, articleId);

            // push the most recent result to local storage
            if(ls){
                localStorage['lastPage'] = JSON.stringify({title:articleTitle,id:articleId});
                console.log(localStorage);
            }

            loading.css("opacity", 0);

            // hide the loader after the CSS transition is complete
            setTimeout(function () {
                loading.hide();
            }, 500);

        }).error(function (data) {
            alert("There was an error loading an article\nPlease try again")
        });

}


/**
 * Get the actual content of the article
 *
 * @param id
 */
function getArticleContent(title, id) {

    // only load the image size for the device
    var thumbDimension = window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight;


    bi.css({
        opacity: 0
    });

    // get image
    $.ajax({
        url:"http://en.wikipedia.org/w/api.php?action=query&prop=pageimages&pithumbsize="+ thumbDimension +"&titles=" + title + "&format=" + desiredFormat,
        dataType:"jsonp"
    }).done(function (data) {
            if(data.query.pages[id].thumbnail != undefined){
                loadBackground(data.query.pages[id].thumbnail.source);
            }
        });

    // get content
    $.ajax({
        url:"http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&titles=" + title + "&format=" + desiredFormat,
        dataType:"jsonp"
    }).done(function (data) {
            populatePage(title, data.query.pages[id].extract);
        });
}

/**
 * Populates the actual page content
 *
 * @param title
 * @param paragraph
 */
function populatePage(title, paragraph) {
    $("#contentTitle").html("<h1>" + title + "</h1>");

    console.log("http://en.wikipedia.org/wiki/"+title.replace(" ","_"))

    $("#contentDescription").html(paragraph + "<a href='http://en.wikipedia.org/wiki/"+title.replace(" ","_")+"' target=_blank>View this article on Wikipedia</a>");
}


/**
 * When the page loads, the magic happens!
 */
$(document).ready(function () {
    if(ls){
        loadHistory();
    }else{
        getRandomFeed();
    }

});
