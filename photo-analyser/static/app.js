$(document).ready(function () {
    let imageList = [];
    let fullScreen = () => {
        var el = document.documentElement,
            rfs = el.requestFullscreen
                || el.webkitRequestFullScreen
                || el.mozRequestFullScreen
                || el.msRequestFullscreen
            ;
        rfs.call(el);
    }

    let statusToggle = () => {
        $("#status").toggle();
    }

    let presentYear = new Date().getFullYear();

    let loadImages = () => {
        statusToggle();
        $("#status").html("Loading...");
        imageList = [];
        $.getJSON(`http://52.15.136.66:8983/solr/photo-album/select?facet.query=photoCreatedYear:[${presentYear-1} TO ${presentYear}]&facet=on&indent=on&q=*:*&wt=json`, (data) => {
            data.response.docs.forEach(doc => {
                if (doc.id) {
                    imageList.push(doc.id);
                }
            })
        }).fail(() => {
            $("#status").html("Error while fetching data.")
        }).always(() => {
            if (imageList.length > 0) {
                statusToggle();
            } else {
                $("#status").html("No photos found.")
            }
            imageList.forEach(imgURL => {
                $(`<div class="item"><img src="${imgURL}"></div>`).appendTo('.carousel-inner');
                $('.item').first().addClass('active');
                $("#photoframe").carousel();
            });
        });
    }

    $("#start").click(() => {
        fullScreen();
        $("#start").toggle();
        loadImages();
    });
});