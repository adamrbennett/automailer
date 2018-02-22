# Automailer
> Automatically run Postman component tests with Newman and report stats to CloudWatch

## Quick Start
1. Make sure binding-xact api will map to host port 80 (modify `docker-compose.test-component.yaml` as necessary)
1. From binding-xact repo, run `docker-compose -f docker-compose.test-component.yaml up`
1. Uncomment the `cloudwatch` reporter from `config.yml` if you want to report stats to CloudWatch
1. From automailer repo, run `npm test -- --build`