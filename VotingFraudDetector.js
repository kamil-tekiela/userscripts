// ==UserScript==
// @name         Voting fraud detector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button unders user card to check for serial voting in the user's reputation history
// @author       Dharman
// @match        *://stackoverflow.com/questions/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($) {
    'use strict';

    initButton();

    const API_KEY = 'gS)WzUg0j7Q5ZVEBB5Onkw((';

    async function checkUser() {
        var repHistory = [];
        var $this = $(this);
        var userId = $('.user-details a', $this.closest('.user-info')).attr('href').match("^/users/(\\d+)/")[1];

        $this.addClass('is-loading').off();

        // Call API endpoint
        let page = 1;
        while(page <= 10) {
            var response = await getHistory(userId, page);
            repHistory = (repHistory || []).concat(response.items);
            if(!response.has_more){
                break;
            }
            if(response.backoff) {
                console.log('Backoff: ' + response.backoff);
                await sleep(response.backoff);
            }
            page++;
        }

        let lastVote = null;
        let secondLastVote = null;
        let occurences = [];
        let total = 0;
        for (const historyItem of repHistory){
            // only upvotes
            if(historyItem.reputation_history_type === "post_upvoted"){
                // If within 2 minutes of last vote
                if(lastVote && lastVote - historyItem.creation_date < 120) {
                    let dateUTC = new Date(historyItem.creation_date * 1000)
                    let arrKey = dateUTC.getUTCFullYear() +'-'+ (dateUTC.getUTCMonth()+1) +'-'+ dateUTC.getUTCDate();
                    (occurences[arrKey] = occurences[arrKey] || []).push(historyItem);
                    total++;
                }

                lastVote = secondLastVote;
                secondLastVote = historyItem.creation_date;
            }
        }

        $this.removeClass('is-loading');
        if(Object.keys(occurences).length > 1 && total>5){
            $this.text('Fraud!').addClass('s-btn__danger');
        } else {
            $this.text('Ok');
        }
    }


    function getHistory (userId, page=1) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://api.stackexchange.com/2.2/users/'+ userId +'/reputation-history?page='+page+'&pagesize=100&site=stackoverflow&key=' + API_KEY,
                onload: function(data) {
                    resolve(JSON.parse(data.responseText));
                }
            });
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    async function initButton(){
        $('.user-info').filter(function( index ) {
            return $(".user-details a", this ).length === 1;
        }).append(
            $('<button/>', {'class': 's-btn s-btn__filled'}).text('check').on('click', checkUser)
        );
    }
})(jQuery);
