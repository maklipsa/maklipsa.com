
var isIE = testIE();
var BOXW = 220;
var BOXH = 195;
var pageW = 0;
var cols = 0;
var first_run = true;

$(document).ready(function () {
    loadHistory();
    changeHorizNav(1);
    shiftPosition();
    if (isIE) shiftPosition();
    if ($("#startpage").length > 0 && $("#startpage").val() != "none" && document.URL.indexOf('#') <= 1) {
        openThisPr($("#startpage").val(), 'list', $("#url").val(), $("#template").val());
    }

});

function movePages() {
    $('.pagecontainer').each(function () {
        if ($("#page_" + $("#current_page").val()).length > 0) $(this).prependTo("#page_" + $("#current_page").val());
        else $(this).prependTo("#items");
    });
}

function closeFeedPr(pid, reopen) {
    if ($('#item_' + pid).length > 0) {
        var url = $('#url').val();
        var prev_type = document.getElementById('prev_type');
        $("#current_open").val("none");
        $("#prev_open").val("none");
        if (document.getElementById('menu_' + pid)) document.getElementById('menu_' + pid).className = $("#prev_type").val();
        printClosed(pid, $("#moduleholder_o").val());
        shiftPosition();
    }
}

function printClosed(pid, content) {
    var container = document.getElementById('item_' + pid);
    var isIE = testIE();

    if ($("#item_" + pid).attr("spot") == 0 && $("#item_" + pid).attr("page") == 0) { // is page
        $("#item_" + pid).html("");
        $("#item_" + pid).attr("className", "pagecontainer");
    } else {
        $("#item_" + pid).html(content);
        $("#load_" + pid).css("display", "none");
        $('#item_' + pid).hover(function () { $(this).addClass('hover'); }, function () { $(this).removeClass('hover'); });
        $("#item_" + pid).attr("className", "project_feed_thumb");
        if (isIE) $("#item_" + pid).addClass("ie");
        try { DD_roundies.addRule(".project_feed_thumb", 5, true); } catch (err) { }


        newHref = document.getElementById('url').value + "#" + pid;
        $('#p' + pid).attr("href", newHref);
        $('#p' + pid).removeClass("hover");
        $('#p' + pid).addClass("nohover");
        $('#p' + pid).click(function () {
            var hash = this.href;
            hash = hash.replace(/^.*#/, '');
            $.historyLoad(hash);
            return false;
        });
    }

    document.getElementById('prev_open').value = "none";

}

function closeFeedInline(data) {
    var starting = data.indexOf("|#=#|");
    var starting2 = data.indexOf("|##=##|");
    var pid = data.substring(0, starting);
    var reopen = data.substring((starting + 5), starting2);
    var content = data.substring((starting2 + 7), data.length);

    if (reopen == "false") {
        printClosed(pid, content);
        if (jQuery.browser.safari) newhash = " ";
        else location.hash = "#";
        shiftPosition();

    } else {
        var newpid = document.getElementById('current_open').value;
        document.getElementById('moduleholder_c').value = content;
        document.getElementById('modulenumber').value = pid;
        openThisPr(newpid, false, false, false, false);
    }

}

function getMass(obj, which) {
    if (which == 'height') {
        if ($(obj).length > 0 && $(obj).css("position") != "absolute") return Math.floor($(obj).height()) + Math.floor($(obj).css("padding-top").replace(/[^0-9]/g, "") + $(obj).css("margin-top").replace(/[^0-9]/g, "")) + Math.floor($(obj).css("padding-bottom").replace(/[^0-9]/g, "") + $(obj).css("margin-bottom").replace(/[^0-9]/g, ""));
        else return 0;
    } else if (which == 'width') {
        if ($(obj).length > 0) return Math.floor($(obj).width()) + Math.floor($(obj).css("padding-left").replace(/[^0-9]/g, "") + $(obj).css("margin-left").replace(/[^0-9]/g, "")) + Math.floor($(obj).css("padding-right").replace(/[^0-9]/g, "") + $(obj).css("margin-right").replace(/[^0-9]/g, ""));
        else return 0;
    }
}

function shiftPosition() {
    var isIE = testIE();
    var BOXW = $(".project_feed_thumb").width();
    var BOXH = $(".project_feed_thumb").height();
    var headImgHeight = getMass('.header_img', 'height');
    var navHeight = getMass('.nav_container.horizontal', 'height');
    var itemsTopPad = getMass('#items_container', 'height');
    var TOPPAD = headImgHeight + navHeight + itemsTopPad;
    var itemsLeftPad = Math.floor($('#items_container').css("padding-left").replace(/[^0-9]/g, "") + $('#items_container').css("margin-left").replace(/[^0-9]/g, ""));
    if ($('.nav_container.horizontal').length > 0) var navWidth = 0;
    else var navWidth = getMass('.nav_container', 'width');
    var LEFTPAD = itemsLeftPad + navWidth;


    if ($('.project_feed_thumb').length > 0) {
        var RIGHTPAD = Math.floor($('.project_feed_thumb').css("padding-right").replace(/[^0-9]/g, "") + $('.project_feed_thumb').css("margin-right").replace(/[^0-9]/g, ""));
        var BOTPAD = Math.floor($('.project_feed_thumb').css("padding-bottom").replace(/[^0-9]/g, "") + $('.project_feed_thumb').css("margin-bottom").replace(/[^0-9]/g, ""));
    } else {
        var RIGHTPAD = 25;
        var BOTPAD = 25;
    }

    this.col_ar = [];

    this.init = function () {
        if (document.getElementById('page_' + $("#current_page").val())) {
            var itemsList = document.getElementById('page_' + $("#current_page").val()).childNodes.length;
            this.pushed_ar = [];
            var found = false;
            var pageW = $("body").innerWidth();
            cols = Math.floor((pageW - (LEFTPAD + RIGHTPAD)) / (BOXW + RIGHTPAD));

            for (i = cols; i > 0; i--) {
                if (i <= (cols - 3)) {
                    targetSelCol = i;
                    break;
                }
            }

            window.onresize = function () {
                if ($('#page_' + $("#current_page").val()).length > 0) shiftPosition();
            }

            var pcount = 0;

            for (i = 0; i < itemsList; i++) {
                var thisItem = document.getElementById('page_' + $("#current_page").val()).childNodes[i];
                if (thisItem.className != "pagecontainer") {
                    var bottom = thisItem.offsetTop + thisItem.offsetHeight;
                    var thisCol = ((thisItem.offsetLeft - 30) / (BOXW + BOTPAD)) + 1;

                    var wpos = $(thisItem).width() + $(thisItem).offset().left + RIGHTPAD + 20;
                    var mpos = (Math.floor($(thisItem).attr("spot")) % cols);
                    var hotarea = pageW - RIGHTPAD - 20;
                    if ($(thisItem).hasClass("project_feed_full") && cols == 4) {
                        if (wpos > hotarea && mpos == 1) this.pushed_ar.splice((pcount + 1), 0, thisItem.id);
                        else if (wpos > hotarea && mpos == 2) this.pushed_ar.splice((pcount - 1), 0, thisItem.id);
                        else if (wpos > hotarea && mpos == 3) this.pushed_ar.splice((pcount - 2), 0, thisItem.id);
                        else this.pushed_ar.push(thisItem.id);

                    } else if ($(thisItem).hasClass("project_feed_full") && cols > 5) {
                        if (wpos > hotarea && mpos > cols - 3) {
                            if (mpos == cols - 2) this.pushed_ar.splice((pcount - 1), 0, thisItem.id);
                            else if (mpos == cols - 1) this.pushed_ar.splice((pcount - 2), 0, thisItem.id);
                        } else if (wpos > hotarea && mpos == 0) {
                            this.pushed_ar.splice((pcount - 3), 0, thisItem.id);

                            console.log("if(" + wpos + " > " + hotarea + ") - " + mpos);
                        } else this.pushed_ar.push(thisItem.id);
                    } else if ($(thisItem).hasClass("project_feed_full") && wpos > hotarea && (mpos >= 3 || (mpos < 3 && cols <= 4))) {
                        if ((wpos - (BOXW + RIGHTPAD)) < hotarea) this.pushed_ar.splice((pcount - 1), 0, thisItem.id);
                        else if ((wpos - (BOXW + RIGHTPAD) * 2) < hotarea) this.pushed_ar.splice((pcount - 2), 0, thisItem.id);
                    } else this.pushed_ar.push(thisItem.id);



                    pcount++;
                } // end if project
            }

            this.col_ar = [];
            if (!cols || cols < 3) cols = 3;
            this.col_ar.push({ x: 0, y: 0 });
            for (var i = 1; i < cols; i++) this.col_ar.push({ x: i, y: 0 });



            this.draw();
        } // end if
    }


    this.draw = function () {

        var ar = pushed_ar;
        for (var o in ar) {

            o = ar[o];
            this.col_ar.sort(this.ySort);
            var d = document.getElementById(o);
            if (d) {
                var W = Math.round(d.offsetWidth / BOXW);


                if (W > 1) this.drawWide(o);
                else {
                    var c = this.col_ar[0];

                    this.drawItem(o, c.x, c.y);
                }
            }
        }

    }

    this.drawWide = function (o) {
        var pc_ar = [];
        this.col_ar.sort(this.xSort);
        var d = document.getElementById(o);
        var W = Math.round(d.offsetWidth / BOXW);
        var uc = cols - W;

        if (uc < 0) {
            return;
        }


        if (uc < 0) { uc = 1; W = 2; }

        for (var i = 0; i <= uc; i++) {
            pc_ar.push(this.col_ar[i]);
            var my = 0;
            var mi = null;
            for (var j = 0; j < W; j++) {
                var ty = this.col_ar[i + j].y;
                if (ty >= my) {
                    my = ty;
                    mi = i + j;
                }
            }
            var td = my;
            for (var j = 0; j < W; j++) td += Math.abs(this.col_ar[mi].y - this.col_ar[i + j].y);
            pc_ar[i].d = td;
            pc_ar[i].od = pc_ar[i].y - my;
        }
        pc_ar.sort(this.dSort);
        var x = pc_ar[0].x;
        var y = pc_ar[0].y
        if (pc_ar[0].od < 0) y -= pc_ar[0].od;
        this.col_ar.sort(this.ySort);
        if (isIE) y = y + 6;
        this.drawItem(o, x, y);

    }



    this.xSort = function (a, b) {
        return (a.x - b.x);
    }

    this.ySort = function (a, b) {
        if (a.y == b.y) return (a.x - b.x);
        else return (a.y - b.y);
    }

    this.dSort = function (a, b) {
        if (a.d == b.d) return (a.x - b.x);
        else return (a.d - b.d);
    }

    this.drawItem = function (o, x, y) {
        var d = document.getElementById(o);
        var W = Math.round(d.offsetWidth / BOXW);

        $("#" + o).css("left", (x * (BOXW + RIGHTPAD) + LEFTPAD));
        $("#" + o).css("top", (y + TOPPAD));
        $("#" + o).css("position", "absolute");
        $("#" + o).css("visibility", "visible");

        if (W > 1) {
            this.col_ar.sort(this.xSort);
            ie_extra = isIE ? 6 : 0;
            for (var i = 0; i < W; i++) this.col_ar[x + i].y = y + $("#" + d.id).innerHeight() + BOTPAD + ie_extra;
        } else this.col_ar[0].y = y + $("#" + d.id).innerHeight() + BOTPAD;
    }

    this.findSameTop = function (myt, t) {
        if (myt == t) return true;
        else return false;
    }
    this.findProximity = function (myt, myb, b) {
        if (b >= myt && b <= myb) return true;
        else return false;
    }
    this.findClosest = function (p1, p2) {
        if (p1 >= p2) return p1;
        else return p2;
    }
    this.findSameCol = function (t1, t2, c1, c2) {
        if (c1 == c2) {
            if (t1 == t2) return true;
            else return false;
        } else return false
    }

    this.init();
    shiftPadding();
    movePages();
}




function shiftPadding() {
    if (document.getElementById('page_' + $("#current_page").val())) {
        var pageHeight = 0;
        var scrollPosition = getScrollHeight();
        var itemsList = document.getElementById('page_' + $("#current_page").val()).childNodes.length;

        for (i = 0; i < itemsList; i++) {
            var thisItem = document.getElementById('page_' + $("#current_page").val()).childNodes[i];
            var thisHeight = thisItem.offsetTop + thisItem.offsetHeight;
            if (thisHeight > pageHeight) pageHeight = thisHeight
        }

        $(".bottompad").css("top", pageHeight + "px");
        $(".bottompad").css("left", "0px");
        $(".bottompad").css("position", "absolute");
        $(".bottompad").css("visibility", "visible");
    } // end if

}

function _getWindowHeight() {
    if (self.innerWidth) {
        frameWidth = self.innerWidth;
        frameHeight = self.innerHeight;
    } else if (document.documentElement && document.documentElement.clientWidth) {
        frameWidth = document.documentElement.clientWidth;
        frameHeight = document.documentElement.clientHeight;
    } else if (document.body) {
        frameWidth = document.body.clientWidth;
        frameHeight = document.body.clientHeight;
    }
    return parseInt(frameHeight);
}

function arfind(ar, value) {
    for (i = 0; i < ar.length; i++) {
        if (ar[i] == value) {
            spot = i;
            break;
        }
    }
    return spot;
}