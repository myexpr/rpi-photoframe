$(document).ready(function () {

    $("#start").click(() => {
        // $("#startup").toggle();
        defaultPlayQuery();
    });

    $("#mixin").click(() => {
        hideModel();
        showMixinModel();
    });

    $("#recent").click(() => {
        hideModel();
        showRecentPhotots();
    });

    $("#oldphotos").click(() => {
        hideModel();
        showOldPhotots();
    })
});

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

let getSolrData = (query, successCallback, errCalBack, alwaysCallBack) => {
    $.getJSON(`http://52.15.136.66:8983/solr/photo-album/select?${query}&indent=on&q=*:*&wt=json`, (data) => {
        successCallback(data);
    }).fail(() => {
        if (errCalBack) {
            errCalBack();
        }
    }).always(() => {
        if (alwaysCallBack) {
            alwaysCallBack();
        }

    });
}

let loadImages = (query, filter) => {
    fullScreen();
    statusToggle();
    $("#status").html("Loading...");
    imageList = [];
    getSolrData(query, (data) => {
        addImages(data.response.docs, filter)
    }, () => {
        $("#status").html("Error while fetching data.")
    }, () => {
        $('.item').remove();
        if (imageList.length > 0) {
            statusToggle();
            $('#startup').fadeOut();
            $('.fullscreen_options').fadeIn();
        } else {
            $('.fullscreen_options').fadeOut();
            $("#status").html("No photos found.")
        }
        imageList.forEach(imgURL => {
            $(`<div class="item"><img src="${imgURL}"></div>`).appendTo('.carousel-inner');
            $('.item').first().addClass('active');
            $("#photoframe").carousel({pause: 'none'});
        });
    });


}

let addImages = (docs, filter) => {
    let list = filter(docs) || [];
    list.forEach(path => {
        imageList.push(path);
    });
}

let hideModel = () => {
    $('#options-modal').modal('hide');
}

let defaultPlayQuery = () => {
    let presentYear = new Date().getFullYear();
    loadImages(`facet.query=photoCreatedYear:[${presentYear - 1} TO ${presentYear}]&facet=on`, (docs) => {
        let imgList = [];
        docs.forEach(doc => {
            if (doc.id) {
                imgList.push(doc.id);
            }
        });
        return imgList;
    });
}


const showRecentPhotots = () => {
    let date = new Date();
    date.setHours(date.getHours() - 2);
    loadImages(`q=indexedDate:[${date.toISOString()} TO NOW]`, (docs) => {
        let imgList = [];
        docs.forEach(doc => {
            if (doc.id) {
                imgList.push(doc.id);
            }
        });
        return imgList;
    });
}

const showOldPhotots = () => {
    let date = new Date();
    date.setYear(date.getFullYear() - 5);

    loadImages(`q=DateTimeOriginal:[* TO ${date.toISOString()}]`, (docs) => {
        let imgList = [];
        docs.forEach(doc => {
            if (doc.id) {
                imgList.push(doc.id);
            }
        });
        return imgList;
    });
}

let showMixinModel = () => {
    $('#mixin-modal').modal('show');
    $("#word-cloud").html('');
    getSolrData(`facet.field=tags&facet.field=photoCreatedYear&facet=on&indent=on&q=*:*`, (data) => {
        let tags = [];
        let solrTags = data.facet_counts.facet_fields.tags;
        let yearCoutns = data.facet_counts.facet_fields.photoCreatedYear;
        for (let i = 0; i < solrTags.length; i = i + 2) {
            tags.push({text: solrTags[i], weight: solrTags[i + 1], link: `javascript:tagClick('${solrTags[i]}')`});
        }

        for (let i = 0; i < yearCoutns.length; i = i + 2) {
            let year =  yearCoutns[i];
            if(year == 0){
                year = "UNKNOWN_YEAR";
            }
            tags.push({text: year, weight: yearCoutns[i + 1], link: `javascript:tagClick('${yearCoutns[i]}','year')`});
        }

        setTimeout(() => {
            $("#word-cloud").jQCloud(tags, {autoResize: true, html: {style: 'cursor: pointer'}, handlers: {click: tagClick}});
        }, 1000);


    });
};

let tagClick = (tagName,label) => {
    $('#mixin-modal').modal('hide');
    let query="";
    if(label == 'year'){
        query =  `q=photoCreatedYear:${tagName}`;
    }else {
        query= `q=tags:(${tagName})`;
    }
    loadImages(query, (docs) => {
        let imgList = [];
        docs.forEach(doc => {
            if (doc.id) {
                imgList.push(doc.id);
            }
        });
        return imgList;
    });
}