var desiredFormat = "json";
var numberOfArticles = 1;
var randomURL = "http://en.wikipedia.org/w/api.php?action=query&rnnamespace=0";
var ls = Modernizr.localstorage;

var currentTitle, currentId, favTimer, imageListener;

var favoriteArray = [];

// cache dom elements
var loading = $("#loading");
var bi = $("#backgroundImage");
var fa = $("#favoriteAlert");
var favorites = $("#favorites");
var fb = $("#favBtn");
var ct = $("#contentTitle");
var cd = $("#contentDescription");
var contentCTA = $("#contentCTA");

/**
 * Loads favorites
 *
 */
function loadFavorites() {
    if(localStorage['favorites'] != undefined){
        favoriteArray = JSON.parse(localStorage['favorites']);
        populateFavorites();
    }

    fb.html("Favorites <span id='favNumber'>"+favoriteArray.length+"</span>");
    $("#favoriteBar").show();

}


/**
 * Load in the background image
 *
 * @param source
 */

function loadBackground(source) {

    imageListener = null;

    if(source != undefined){

        var bgImg = new Image();
        imageListener = $(bgImg).load(function () {

            bi.css({
                backgroundImage:'url(' + bgImg.src + ')'
            });

            // put this on a delay to prevent a flicker when the image changes.
            setTimeout(function(){
                bi.css({
                    opacity:1
                });
            },200)
        });

        bgImg.src = source;
    }
}



/**
 * Gets the feed from Wikipedia
 *
 * @param type
 */

function getRandomFeed() {

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

    title = title.replace("^","'");

    $("#favoriteHolder").hide();

    // only load the image size for the device
    var thumbDimension = window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight;

    bi.css({
        opacity: 0
    });



    // get content
    $.ajax({
        url:"http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&titles=" + title + "&format=" + desiredFormat,
        dataType:"jsonp"
    }).done(function (data) {

            $("#junkDiv").html(data.query.pages[id].extract);

            // If there is an actual description, poulate the page. Otherwise run it again.
            if($("#junkDiv p")[0].innerHTML != ""){

                currentTitle = title;
                currentId = id;


                populatePage(title, $("#junkDiv p")[0]);
                checkForFavorites(id);

                // get image
                $.ajax({
                    url:"http://en.wikipedia.org/w/api.php?action=query&prop=pageimages&pithumbsize="+ thumbDimension +"&titles=" + title + "&format=" + desiredFormat,
                    dataType:"jsonp"
                }).done(function (data) {
                        if(data.query.pages[id].thumbnail != undefined){
                            loadBackground(data.query.pages[id].thumbnail.source);
                        }
                    }).error(function (data) {
                        alert("There was an error loading an image\nPlease try again")
                    });

            }else{
                console.log("it was empty");
                getRandomFeed()
            }



        }).error(function (data) {
            alert("There was an error loading an article\nPlease try again")
        });

}



/**
 * Populates the actual page content
 *
 * @param title
 * @param paragraph
 */

function populatePage(title, paragraph) {
    ct.html("<h1>" + title + "</h1>");
    cd.html(paragraph);
    contentCTA.html("<a class='button wikiCTA' href='http://en.wikipedia.org/wiki/"+title.replace(" ","_")+"' target=_blank>View this article on Wikipedia</a>");
    window.scrollTo(0,1);

}

/**
 * Build the favorites list
 *
 */
function populateFavorites(){

    var favList = '';

    var tempArray = favoriteArray.slice(0).reverse();

    $.each(tempArray, function(index, item){
        var title = item.title.replace("'","^");
        favList += "<div class='favorite'><div class='favTitle' onclick='getArticleContent(\""+title+"\","+item.id+")'>"+item.title+"</div><div class='removeFavorite icon-close' onclick='updateFavorites(\"remove\",\"null\","+item.id+")'></div></div><div class='clear'></div>"
    });

    $("#favoriteItems").html(favList);

}
/**
 * Update the favorites list
 *
 * @param title
 * @param id
 */
function updateFavorites(task, title, id){

    if(task == "add"){

        fa.html("<strong>"+title + "</strong> added to your favorites");

        favoriteArray.push({title:title, id:id});

    }else if(task = "remove"){

        // if I am removing the currently showing article
        if(id == currentId){
            favorites.removeClass("fav");
        }

        // have to create a cloned array cause if I splice out of the actual array, an error gets thrown in the each loop
        var tempArray = favoriteArray.slice(0);

        $.each(favoriteArray, function(index,item){

            if(item.id == id){
                fa.html("<strong>" + item.title + "</strong> removed from your favorites");
                tempArray.splice(index,1);
            }
        });

        // reset the favoriteArray with my cloned array
        favoriteArray = tempArray;

    }

    localStorage["favorites"] = JSON.stringify(favoriteArray);

    populateFavorites();

    fb.html("Favorites <span id='favNumber'>"+favoriteArray.length+"</span>");

    fa.css({
        opacity: 1,
        bottom: 60
    });

    clearTimeout(favTimer);

    favTimer = setTimeout(function(){
        fa.css({
            opacity: 0,
            bottom: 50
        });
    },2000);


}

function checkForFavorites(id){
    favorites.removeClass("fav");
    $.each(favoriteArray, function(index,item){
        if(item.id == id){
            favorites.addClass("fav");
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

    favorites.click(function(){
        if(!$(this).hasClass("fav")){
            $(this).addClass("fav");
            updateFavorites("add", currentTitle, currentId);

        }else{
            $(this).removeClass("fav");
            updateFavorites("remove", currentTitle, currentId);
        }
    });

    $("#favBtn").click(function(){
        $("#favoriteHolder").show();
    });

    $("#closeFavs").click(function(){
        $("#favoriteHolder").hide();
    });

    getRandomFeed();

});
