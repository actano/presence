# presence
List of teams indicating the presence and absence of its members.

## Configuration

Define your teams and other settings by providing a team config file. Possible values are visible in the [team config example](./example-team-config.yml).

## Running locally
- Clone this repository
- Create a environment variable:
    `export CONFIG=https://here/lays/your/team-config.yml`
- Install dependencies: `yarn install`
- Start the app `yarn start`

## Running in docker

A [Docker image is available on Docker hub](https://hub.docker.com/r/rplan/presence).

```bash
docker run --rm -e CONFIG=https://here/lays/your/team-config.yml --name=presence -p 8080:80 rplan/presence
```

## open questions
in case of problems, I'd wish to find the answers or links to the answers of these questions here:
- how can the app be tested? -> no tests implemented yet.
