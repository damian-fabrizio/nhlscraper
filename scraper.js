const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

const baseUrl = "https://www.hockey-reference.com";
// delay between requests
const playerLinkScrapeTime = 3500;
// empty array to fill with links later
const letters = [];

// let i be initialized as the unicode value that is at 'a'
// so long as i is less than the unicode value at z, keep looping
// this just prints out the entire alphabet
for (let i = "a".charCodeAt(0); i <= "z".charCodeAt(0); i++) {
  // push the letters of the alphabet into the letters array and convert them to a string
  letters.push(String.fromCharCode(i));
}
// console.log(letters);

// fetching each link for each letter of the alphabet (26 links)
async function getPlayerLinks() {
  // gonna store the links in this array
  let links = [];
  // loop over each charater in the letters array
  for (const c of letters) {
    // concatenate the baseUrl to /players/ and each letter of the alphabet
    // each link returned will be baseUrl/players/(a letter)/ which is the link to each of the
    // 26 links for every NHL player with the last name starting with that letter
    const url = `${baseUrl}/players/${c}/`;
    console.log("Fetching each letter url: ", url);
    try {
      // initialization
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      // find the div_players id store it in playerList
      const playerList = $("#div_players");

      // for each element of playerList, find the p tag
      playerList.find("p").each((i, element) => {
        // a player is an element object for each p tag
        const player = $(element);
        // if "non_nhl" class does not exist in player
        if (!player.hasClass("non_nhl")) {
          // find the a tag along with its href store in href variable
          const href = player.find("a").attr("href");
          // if href exists push the url to the links array
          if (href) links.push(`${baseUrl}${href}`);
        }
      });

      // wait 3.5 seconds between each request so as to not violate rate limits
      await new Promise((resolve) => setTimeout(resolve, playerLinkScrapeTime));
    } catch (error) {
      console.error("Something went wrong: ", error);
      // reutrn empty array if sumting goes wong
      return [];
    }
  }
  return links;
}
// function that makes a str an integer
function isInteger(str) {
  return /^\d+$/.test(str);
}

// function to retrieve player information
async function getPlayerDetails(playerUrl) {
  // create array to hold every team each player has been with
  const uniquePlayerTeamsArray = [];
  const pushedTeams = {};
  let filteredTotGames = "";

  try {
    // initializing
    const response = await axios.get(playerUrl);
    const $ = cheerio.load(response.data);

    // ------ GETTING PLAYER FULL NAME ------

    // find span that are childern of h1 tag and extract text content (the name)
    const playerName = $("h1 span").text().trim();
    // console.log("name", playerName);

    // ------ GETTING PLAYER FIRST NHL SEASON ------

    // initialize jQuery object that contains the text content of the player_stats id with tbody child that selects the first tr child of the tbody and then selects the th and a that are inside it
    const firstSeason = $(
      "#player_stats tbody tr:first-child th a, #goalie_stats tbody tr:first-child th a"
    )
      .text()
      .trim();

    if (firstSeason) {
      // console.log("First Season:", firstSeason);
    } else {
      console.log("Something went wrong");
    }

    // ------ GETTING PLAYER TOTAL CAREER GAMES ------
    // initialize object with selector path filter it to only select first instance of data-stat='games' that is an integer value and extract the text
    const totGames = $(
      "#player_stats tfoot [data-stat='games'], #goalie_stats tfoot [data-stat='goalie_games']"
    )
      .filter(function () {
        // ensure that each DOM element being processed is an integer
        return isInteger($(this).text().trim());
      })
      .first();

    // if totGames exists/isnt empty
    if (totGames) {
      // extract the text
      filteredTotGames = totGames.text().trim();
      // console.log("Total Games Played:", filteredTotGames);
    } else {
      console.log("Something went wrong");
    }
    // ------ GETTING ALL TEAMS PLAYER HAS BEEN ON ------
    // initialize object, map each tr
    $("#player_stats tbody tr, #goalie_stats tbody tr").each((i, element) => {
      // store each element in 'row'
      const row = $(element);

      // get league in a td located on fourth child of parent
      const playerLeague = row.find("td:nth-child(4) a").text().trim();
      // locate the td that is the 3rd child of parent and get its a tag and extract as string
      const playerTeam = row.find("td:nth-child(3) a").text().trim();

      // if the players league is NHL
      if (playerLeague === "NHL" && playerTeam) {
        if (!pushedTeams[playerTeam]) {
          // push it over to uniquePlayerTeamsArray
          uniquePlayerTeamsArray.push(playerTeam);
          // put it in pushedTeams so we know its been used
          pushedTeams[playerTeam] = true;
        }
      }
    });
    // console.log("Teams: ", uniquePlayerTeamsArray);
    return {
      name: playerName,
      firstYear: firstSeason,
      gamesPlayed: filteredTotGames,
      teams: uniquePlayerTeamsArray,
    };
  } catch (error) {
    console.error("Something went wrong", error);
    return [];
  }
}

// this function brings it all together
async function main() {
  // wait for getPlayerLinks() to run store in playerLinks
  const playerLinks = await getPlayerLinks();
  // console.log(playerLinks);

  // initialize playerDetails array where all of the info will live
  let playerDetails = {};
  // for every playerUrl in playerLinks
  for (const playerUrl of playerLinks) {
    // print it out
    console.log(`Fetching player: ${playerUrl}`);
    // wait for playerDetails to run passing in the playerUrl
    const details = await getPlayerDetails(playerUrl);
    // if details exists and isnt empty
    if (details) {
      // push the details into the playerDetails array
      playerDetails[details.name] = details;
    }
    // wait 3.5 seconds every individual time this is performed
    await new Promise((resolve) => setTimeout(resolve, playerLinkScrapeTime));
    console.log(playerDetails);
  }

  // write the file to everyNHLPlayer.json and convert it to string outputting playerDetails, null meaning no alteration made to the value-object properties, and 2 for 2 spaces of indentation of the object contents.
  fs.writeFile(
    "everyNHLPlayerJan25.json",
    JSON.stringify(playerDetails, null, 2),
    (err) => {
      if (err) {
        console.error("Something went wrong", err);
      } else {
        console.log("Successfully written all data to file");
      }
    }
  );
}
main();
