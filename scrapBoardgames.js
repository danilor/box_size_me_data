/**
 * This file will try to scrap all the pages we can from
 * BoardGameGeek and try to merge all list of games into one single place.
 */

/// Initial libraries

const fs = require('fs-extra');
const https = require('https');
const axios = require('axios');
const cheerio = require('cheerio');


/// The BGG configuration
const bggConfig = require("./config/bgg.config.js");

/// and the general configuration
const folderConfig = require("./config/folder.config");

/// Starting and ending page
const startingPage = 1;
const endingPage = 40;


/**
 * This will write a temporal file
 * @returns {Promise<void>}
 */
async function writeTemporalFile(page, html) {
    /// await fs.writeFileSync(folderConfig.tempFolder + 'HTML_' + page + '.html', html, 'utf-8');
}

/**
 * This will store the result
 * @param jsonResult
 * @returns {Promise<void>}
 */
async function storeResult(jsonResult){
    log('Storing all elements in a json file');
    const data = JSON.stringify(jsonResult);
   await fs.writeFileSync( folderConfig.dataFolder +'list.json', data);

    // console.log(data);
    log('Storaged completed');
}

/**
 * This will clean the string from
 * all string breaks and weird symbols
 */
function cleanString(s) {
    return s.replace(/(\r\n|\n|\r|\t)/gm, "");
}

/**
 * This wiall process the content of the page and return only the information we
 * need
 * @param html
 * @returns {Promise<void>}
 */
async function processPage(html) {
    const $ = cheerio.load(html);
    /*const elements = $('#' + bggConfig.tableID + ' tbody tr').each(function(index,element){
        if(index === 0){
            log(element);
        }
    });*/

    const elementsInPage = [];

    $('#' + bggConfig.tableID + ' tbody tr').each(function (index, element) {

        const rank = $(element).find('.collection_rank a').attr('name');

        if (index > 0 && rank !== null && rank !== undefined) {
            // log($(element).html());

            elementsInPage.push({
                rank: parseInt(rank, 10),
                thumbnail: $(element).find('.collection_thumbnail a img').attr('src'),
                name: cleanString($(element).find('.collection_objectname a.primary').text().toString()),
                description: cleanString($(element).find('.collection_objectname p.dull').text()),
                year: cleanString($(element).find('.collection_objectname span.dull').text().replace('(').replace(')')),
                rating: parseFloat(cleanString($(element).find('.collection_bggrating').first().text())),

            });
        }

    });
    /// The very first element is the header, so we need to take it out

    // log('Elements found in page');
    // log(elementsInPage.length);

    return elementsInPage;

}


/**
 * This will read all pages though the first to the last one
 * of them
 */
async function readAllPages() {

    let allElements = [];

    for (let i = startingPage; i <= endingPage; i++) {
        const html = await readPage(i);
        const validElements = await processPage(html);
        // log(validElements);
        allElements = [...allElements, ...validElements];
    }


    log('All elements');
    log(allElements.length);

    await storeResult(allElements);

    return allElements;


}


/**
 * It will read one single page
 * @param page
 * @returns {Promise<void>}
 */
async function readPage(page) {
    const currentURL = bggConfig.baseURLPage.replace('[#]', page);
    log("Reading URL: " + currentURL);
    const response = await axios.get(currentURL);
    await writeTemporalFile(page, response.data.toString());
    log('Page Read');
    // log(response)
    return response.data;

}


/**
 * Helper function
 */
function log(t) {
    if (typeof t === 'string') {
        console.log('[LOG] ' + t);
    } else {
        console.log(t)
    }
}

/**
 * Helper function to print an space
 */
function space() {
    log(' ');
}

/**
 * The main function
 */
function main() {
    log('==============================');
    log('Starting the scrapping process');
    log('==============================');
    space();
    readAllPages();
}

/// Start the application
main();
