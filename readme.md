# Unofficial Documentation for the Draft Kings API
## Description
This is unofficial documentation for the Draft Kings API. Draft Kings very much does NOT intend to have this API used by the public, but then again they don't lock the API down either. If you've ever dealt with APIs that are only intended to be used by the company deploying them, you would know that this documentation is completely without warranty and could go out of date at any moment. Similarly, Draft Kings absolutely will not care at all if you build a big application based on their current API and then roll out a V2 the next day and deprecate V1. You have been warned. :-)

## Core Data Structure
There's a lot of information in the API documentation that is probably superfluous, so I'll give a summary of what most people are probably reading this for: the slate for every draft group. But first, a quick note about the example URLs I'm about to use. Given how transient a lot of the data is (slates come and go quickly), many of the links are probably broken. Generally the part of the URL needing updating with fresh data is quite obvious, so they should still be helpful. 

Anyway, the core data structure is as follows:

1. **Sports:** Highest level entity which inturn consist of. You can get the sport in question by clicking the sport in the top nav bar. For instance, clicking LOL nets: https://www.draftkings.com/lobby#/LOL. This is useful because if you're looking to get a JSON list of contests for a particular sport you can feed in the sport as a parameter (https://www.draftkings.com/lobby/getcontests?sport=LOL). Alternatively, you could stick to using the API by hitting https://api.draftkings.com/sites/US-DK/sports/v1/sports?format=json to return a JSON list.
2. **Games:** Which are not the things you enter to win, they are basically rulesets. You can actually get the details of rulesets, or game types, from a DK API: https://api.draftkings.com/lineups/v1/gametypes/1/rules. Game rulesets are the basis for...
3. **Contests:** Which are the individual things you can pay money to enter in. As was mentioned earlier, you can get all contests or contests for a specific sport using https://www.draftkings.com/lobby/getcontests?sport=LOL. This will return a ton of data but it is quite cryptically formatted. It's easy enough to guess at the data points but if you want additional detail and fully labeled attributes, you could use this API by pulling the contest ID, for example: https://api.draftkings.com/contests/v1/contests/105313170?format=json
4. **Draft Groups:** Each Contest has a Draft Group, which is basically a unique ID for that particular slate. It is the most important building block of getting to the information you want. Draft Groups house information like the teams on the slate, contest start time and most importantly...
5. **Draftables:** This is probably what most of you are after. The players and salaries for a given Draft Group. You can get that paydirt by hitting this URL and of course replacing the ID at the end with whatever slate you're after: https://api.draftkings.com/draftgroups/v1/draftgroups/46589/draftables

## Example Retrieving Slates and Players
Ok now to the actual slate you're no doubt impatiently waiting for. I'm going to use League of Legends for this example because I'm a nerd who enjoys doing data science stuff on esports. The high level code flow is:

1. If you wanted to grab every slate as it becomes available for a specific sport you would first need the Draft Groups for the sport. Draft Groups are basically the ID for each slate, so they're very important. Let's say you don't want to parse 100s of contests so you may want filter down to just a single sport. To do this you would call https://www.draftkings.com/lobby/getcontests?sport=LOL.
2. From that you would want to get a distinct set of all the Draft Groups. These IDs have the key of ['dg'] for "Draft Group" and they are found under ['Contests'] which is a list of all contests. Grab all the Draft Groups IDs, filter them to a distinct set (if there are two slates, there would be two Draft Groups), and with that list of IDs you're nearly there. 
3. Now you can loop through all the slates on deck for that particular sport using these IDs. To do this, use the Draftables API to get players, salaries, etc. whcih is found here: https://api.draftkings.com/draftgroups/v1/draftgroups/46589/draftables
4. This page will have all the knowledge you would want to host a fantasy league, programatically run a lineup optimizer, etc. etc.

Alright, how 'bout some code? I'll write this quick script with Node because for some reason I'm in the mood to use brackets everywhere and type "await" a lot.

```javascript
const got = require('got');
const util = require('util');


(async () => {
    try {
        //Get the contests
        const contestsResponse = await got('https://www.draftkings.com/lobby/getcontests?sport=LOL');
        const contestsJson = JSON.parse(contestsResponse.body);

        //Loop through all contests and build a list of the unique draft groups
        let groupIdList = [];
        contestsJson['Contests'].forEach(contest => {
            if (!groupIdList.includes(contest['dg'])) {
                groupIdList.push(contest['dg'])
            }
        });

        //For each draft group, grab the draftables by replacing the parameter in the URL with the correct group Id
        for (const groupId of groupIdList) {
            console.log(groupId);
            const draftablePlayersResponse = await got(util.format('https://api.draftkings.com/draftgroups/v1/draftgroups/%s/draftables', groupId));
            const draftableplayersJson = JSON.parse(draftablePlayersResponse.body);

            //Nice! Now we have the players so let's just console.log them as a simple example
            draftableplayersJson['draftables'].forEach(player => {
                console.log(player['displayName']);
                console.log(player['position']);
                console.log(player['salary']);
                console.log('***')
            });
        }

    } catch (error) {
        console.log(error);
    }
})();

```

## API Documentation
All parameters are query string.

### **Get Contests**
The fundamental endpoint. Contains wide ranging data from Contests, GameSets, GameTypes, DraftGroups, and other ancillary data.

#### Endpoint
https://www.draftkings.com/lobby/getcontests

#### Parameters
1. Sport: Not required. List of valid values available from ['regionAbbreviatedSportName'] in https://api.draftkings.com/sites/US-DK/sports/v1/sports?format=json

#### Example
https://www.draftkings.com/lobby/getcontests?sport=LOL


### **Detailed Contest Information**
Provides lowest level granularity of detail on a single contest. Helpful endpoint because it provides redundant data points with GetContests but in a more readable format.

#### Endpoint
https://api.draftkings.com/contests/v1/contests/[ContestId]?format=json

#### Parameters
1. ContestId - Obtainable from the GetContests endpoint. Also visible throughout the site in the URL patterns through the frontend.

#### Example
https://api.draftkings.com/contests/v1/contests/105502444?format=json


### **Get DraftGroups**
More detailed information on the slate itself including start time and all of the games/matches contained within the slate. 

#### Endpoint
https://api.draftkings.com/draftgroups/v1/[draftGroupId]

#### Parameters
1. DraftGroupId - A list of DraftGroupIds is obtainable from the GetContests call. 

#### Example
https://api.draftkings.com/draftgroups/v1/46589


### **Get Rulesets**
Detailed ruleset for a particular game type. 

#### Endpoint
https://api.draftkings.com/lineups/v1/gametypes/[gameTypeId]/rules

#### Parameters
1. GameTypeId - I don't know if there is an API that serves this up comprehensively. I've seen it towards the end of the GetContests call but I don't know if that just lists all Game Types available currently across all contests or if it's a full list.

#### Example
https://api.draftkings.com/lineups/v1/gametypes/1/rules


### **Get Draftable Players**

#### Endpoint
https://api.draftkings.com/draftgroups/v1/draftgroups/[draftGroupId]/draftables

#### Parameters
1. DraftGroupId - Obtaining this ID is detailed elsewhere.

#### Example
https://api.draftkings.com/draftgroups/v1/draftgroups/46589/draftables


### **Get Available Players**
Metadata, imagery, and other obscure information regarding individual players related to slate. Found to be of limited use. 

#### Endpoint
https://www.draftkings.com/lineup/getavailableplayers?draftGroupId=[draftGroupId]

#### Parameters
1. DraftGroupId - Obtaining this ID is detailed elsewhere.

#### Example
https://www.draftkings.com/lineup/getavailableplayers?draftGroupId=46887


### **Get Countries**
Returns countries licensed to use the Draft Kings service? No idea how this would be helpful.

#### Endpoint
https://api.draftkings.com/addresses/v1/countries

#### Parameters
None.

#### Example
https://api.draftkings.com/addresses/v1/countries


### **Get Regions**
Returns regions in the US where the service is legal to use? Also of limited use.

#### Endpoint
https://api.draftkings.com/addresses/v1/countries/[countryCode]regions

#### Parameters
1. CountryCode - Obtainable from Get Countries.

#### Example
https://api.draftkings.com/addresses/v1/countries/US/regions


### **Get Rules and Scoring**
Return HTML version of the rules and scoring. Obviously. 

#### Endpoint
https://api.draftkings.com/rules-and-scoring/RulesAndScoring.json

#### Parameters
None.

#### Example
https://api.draftkings.com/rules-and-scoring/RulesAndScoring.json


### **Get Sports**
Return all sports currently offered by Draft Kings in addition to some IDs and other codes for each sport.

#### Endpoint
https://api.draftkings.com/sites/US-DK/sports/v1/sports

#### Parameters
None.

#### Example
https://api.draftkings.com/sites/US-DK/sports/v1/sports



## Contact Information

Pick your poison at https://seandrum.github.io/.