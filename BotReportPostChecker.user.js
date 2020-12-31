// ==UserScript==
// @name         Post checker from https://bot.dharman.net/
// @homepage     https://github.com/kamil-tekiela/userscripts
// @version      1.1
// @description  Checks if the post is deleted
// @author       Dharman
// @match        *://bot.dharman.net/reports*
// @match        *://bot.dharman.net/search*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($) {
    'use strict';

    const API_KEY = 'gS)WzUg0j7Q5ZVEBB5Onkw((';

    checkPosts();

    async function checkPosts() {
        let posts = $('.postID');
        var postLinks = posts.map(function() {
            return this.innerHTML;
        }).get();

        let idMap = JSON.parse(sessionStorage.getItem("botIdMap")) || {};

        postLinks = postLinks.filter(id => !(id in idMap));

        var result = [];
        if(postLinks.length) {
            // Call API endpoint
            var response = await getHistory(postLinks.join(';'), 1);
            result = response.items.map(a => a.answer_id);
        }


        posts.map(function() {
            let item = parseInt(this.innerHTML);
            if(!result.includes(item) && !idMap[item]){
                $(this).closest('.container').css('background-color', 'rgb(185 57 57 / 12%)');
                idMap[item] = false;
            } else {
                idMap[item] = true;
            }
        })

        sessionStorage.setItem("botIdMap", JSON.stringify(idMap));
    }


    function getHistory (ids, page=1) {
        console.log("Made an API call");

        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://api.stackexchange.com/2.2/answers/'+ ids +'?page='+page+'&pagesize=100&site=stackoverflow&key=' + API_KEY,
                onload: function(data) {
                    resolve(JSON.parse(data.responseText));
                }
            });
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

})(jQuery);
