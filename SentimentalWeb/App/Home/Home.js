﻿/// <reference path="../App.js" />

//global variables
window.thisapp = {};
thisapp.score = "";
thisapp.keyphrases = "";

//Please replace this key with your own key for your instance of the Azure Machine Learning Text Analysis service
thisapp.azureServiceKey = "YourKeyGoesHere";

(function () {
    "use strict";

    // The initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            app.initialize();
            $('#analyse-button').click(checkSelectionMode);
            $('#insert-score-button').click(insertScore);
            $('#insert-phrases-button').click(insertPhrases);
            $('#analyse-new-button').click(resetUiToDefault);
        });
    };

    function checkSelectionMode()
    {
        if ($('#selection-mode-check').prop('checked')) {
            getDataFromSelection();
        }
    }

    // Reads data from current document selection and displays a notification
    function getDataFromSelection() {
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {

                    if (result.value != "")
                    {
                        getSentimentAnaylsisData(result.value);
                        getKeyPhraseAnaylsisData(result.value);

                        //update ui
                        $("#analysis-intro-text").text("Analysis of: '" + result.value + "'");
                        resetUi(false);
                    }
                    else {
                        if (!$('#selection-mode-check').prop('checked')) {
                            app.showNotification('Please select some text ... we may be powered by the Azure Machine Learning but we cannot predict what you will write before you write it ... yet! #creepy');
                        }
                    }
                } else {
                    app.showNotification('Error:', result.error.message);
                }
            }
        );
    }


    function getSentimentAnaylsisData(text)
    {
        if (text != "")
        {
            var authorization = "Basic " + thisapp.azureServiceKey;
            var accept = "application/json";
            var apiUrl = "https://api.datamarket.azure.com/data.ashx/amla/text-analytics/v1/GetSentiment?Text=" + text;
            $.support.cors = true;
            $.ajax({
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("ACCEPT", accept);
                },
                url: apiUrl,
                method: 'GET',
                dataType: 'json',
                complete: function (response) {
                    var data = JSON.parse(response.responseText);

                    //set the sentiment colour
                    var sentimentThemeColour = "darkorange";
                    if (data.Score < 0.4) {
                        sentimentThemeColour = "red";
                    }
                    if (data.Score > 0.59) {
                        sentimentThemeColour = "green";
                    }

                    //construct a more readable string showing the score as a percentage
                    var readableSentimentScore = (data.Score * 100).toFixed(0) + "%";

                    //store in variable for insertion later
                    thisapp.score = readableSentimentScore;

                    //write to ui
                    $("#sentiment-score").text(readableSentimentScore);
                    $("#sentiment-meter").css("background-color", sentimentThemeColour);
                    $("#sentiment-meter").css("width", readableSentimentScore);
                }
            });
        }
    }

    function getKeyPhraseAnaylsisData(text) {
        if (text != "") {
            var authorization = "Basic " + thisapp.azureServiceKey;
            var accept = "application/json";
            var apiUrl = "https://api.datamarket.azure.com/data.ashx/amla/text-analytics/v1/GetKeyPhrases?Text=" + text;
            $.support.cors = true;
            $.ajax({
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("ACCEPT", accept);
                },
                url: apiUrl,
                method: 'GET',
                dataType: 'json',
                complete: function (response) {
                    var data = JSON.parse(response.responseText);

                    //check that there are any key phrases
                    if (data.KeyPhrases.toString() == "") {
                        $("#key-phrases").text("[No key phrases]");

                        //store in variable for insertion later
                        thisapp.keyphrases = "[No key phrases]";
                    }
                    else {
                        $("#key-phrases").text("");
                        for (var phrase in data.KeyPhrases) {
                            $("#key-phrases").append(data.KeyPhrases[phrase] + "<br>");
                        }

                        //store in variable for insertion later
                        thisapp.keyphrases = data.KeyPhrases.toString();
                    }

                }
            });
        }
    }

    function insertScore() {
        Office.context.document.setSelectedDataAsync(thisapp.score,
            function (asyncResult) {
                if (asyncResult.status === "failed") {
                    var error = asyncResult.error;
                    app.showNotification("There's a problem!", "The text could not be inserted (" +error.name +": " +error.message +")");
                }
            });
    }

    function insertPhrases() {
        Office.context.document.setSelectedDataAsync(thisapp.keyphrases,
            function (asyncResult) {
                if (asyncResult.status === "failed") {
                    var error = asyncResult.error;
                    app.showNotification("There's a problem!", "The text could not be inserted (" + error.name + ": " + error.message + ")");
                }
            });
    }

    function resetUiToDefault() {
        resetUi(true);
    }

    function resetUi(selectionModeOn) {
        if (selectionModeOn) {
            //clear UI
            $("#sentiment-score").text("");
            $("#sentiment-theme").text("");
            $("#key-phrases-header").hide();
            $("#key-phrases").text("");
            $("#sentiment-meter").css("background-color", "darkorange");
            $("#sentiment-meter").css("width", '0%');

            //hide UI
            $("#analysis-intro-text").hide();
            $("#key-phrases-header").hide();
            $("#sentiment-progress").hide();
            $("#buttons-intro-text").hide();
            $("#insert-score-button").hide();
            $("#insert-theme-button").hide();
            $("#insert-phrases-button").hide();
            $("#analyse-new-button").hide();
        }
        else {
            //reveal UI
            $("#analysis-intro-text").show();
            $("#key-phrases-header").show();
            $("#sentiment-progress").show();
            $("#buttons-intro-text").show();
            $("#insert-score-button").show();
            $("#insert-theme-button").show();
            $("#insert-phrases-button").show();
            $("#analyse-new-button").show();
        }
    }


})();
