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
            console.log('Players for GroupId:')
            console.log(groupId);
            console.log('\n')

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