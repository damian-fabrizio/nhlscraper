# Hockey Reference Web Scraper

## Skills Used
-Javascript, NodeJs, Cheerio, Axios, JQuery

## Summary
This is the web scraper I built in NodeJs that created the player universe that my NHLgrid game pulled names from.
This scraper was built using the Cheerio library for scraping, and the Axios library for asynchronous requests.

It was created to scrape names and other unique player statistics from the HockeyReference website, which houses a database
of NHL players. 

My script retrieved over 8,000 player names, and for each player name, some individual attributes such as 
the teams they played for, the first year they entered the league, and the amount of games they have played in their career.

Each player is formatted and stored as a JSON object, making it simple for me to fetch any player I want in an easy to interpret key-value pair.
