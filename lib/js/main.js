var desiredFormat = "json";
var numberOfArticles = 1;
var randomURL = "http://en.wikipedia.org/w/api.php?action=query&rnnamespace=0";
var ls = Modernizr.localstorage;

var currentTitle, currentId, favTimer;

var favoriteArray = [];

// cache dom elements
var loading = $("#loading");
var bi = $("#backgroundImage");


/**
 * Loads favorites
 *
 */
function loadFavorites() {
    if(localStorage['favorites'] != undefined){
        favoriteArray = JSON.parse(localStorage['favorites']);
    }

    $("#favBtn").html("Favorites <span id='favNumber'>"+favoriteArray.length+"</span>");
    $("#favoriteBar").show();
}


/**
 * Load in the background image
 *
 * @param source
 */

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
            currentTitle = title;
            currentId = id;
            populatePage(title, data.query.pages[id].extract);
            checkForFavorites(id);

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
    $("#contentDescription").html(paragraph);
    $("#contentCTA").html("<a class='button wikiCTA' href='http://en.wikipedia.org/wiki/"+title.replace(" ","_")+"' target=_blank>View this article on Wikipedia</a>");
    window.scrollTo(0,1);

}


/**
 * Add items to the favorites list
 *
 * @param item
 */

function addToFavorites(title, id){


}

/**
 * Remove items from the favorites list
 *
 * @param title
 * @param id
 */
function updateFavorites(task, title, id){

    if(task == "add"){

        $("#favoriteAlert").html(title + " added to your favorites");

        favoriteArray.push({title:title, id:id});



    }else if(task = "remove"){

        $.each(favoriteArray, function(index,item){
            if(item.id == id){

                $("#favoriteAlert").html(item.title + " removed from your favorites");

                favoriteArray.splice(index,1);
            }
        })

    }

    if(ls){
        localStorage["favorites"] = JSON.stringify(favoriteArray);
    }

    $("#favBtn").html("Favorites <span id='favNumber'>"+favoriteArray.length+"</span>");

    $("#favoriteAlert").css({
        opacity: 1,
        bottom: 60
    });

    clearTimeout(favTimer);

    favTimer = setTimeout(function(){
        $("#favoriteAlert").css({
            opacity: 0,
            bottom: 50
        });
    },2000);


}

function checkForFavorites(id){
    $("#favorites").removeClass("fav");
    $.each(favoriteArray, function(index,item){
        if(item.id == id){
            $("#favorites").addClass("fav");
        }
    })
}

/**
 * When the page loads, the magic happens!
 */

$(document).ready(function () {
    if(ls){
        loadFavorites();
    }

    getRandomFeed();

    $("#favorites").click(function(){
        if(!$(this).hasClass("fav")){
            $(this).addClass("fav");
            updateFavorites("add", currentTitle, currentId);

        }else{
            $(this).removeClass("fav");
            updateFavorites("remove", currentTitle, currentId);
        }
    })

});
