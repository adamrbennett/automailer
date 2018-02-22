const AWS = require('aws-sdk'),
      cloudwatch = new AWS.CloudWatch({
        region: 'us-east-1'
      });

module.exports = function (newman, options) {
  newman.on('beforeDone', function (err, o) {
      if (err) {
        console.error(err);
        return;
      }

      let totalCount = o.summary.run.stats.requests.total;
      let failedCount = o.summary.run.stats.requests.failed;
      let passedCount = totalCount - failedCount;

      var params = {
        MetricData: [
          {
            MetricName: 'PassedCount',
            Dimensions: [
              {
                Name: 'Service',
                Value: options.service
              }
            ],
            StorageResolution: 60,
            Timestamp: new Date(),
            Unit: "Count",
            Value: passedCount
          },
          {
            MetricName: 'FailedCount',
            Dimensions: [
              {
                Name: 'Service',
                Value: options.service
              }
            ],
            StorageResolution: 60,
            Timestamp: new Date(),
            Unit: "Count",
            Value: failedCount
          }
        ],
        Namespace: 'SFI/Tests/Component'
      };

      cloudwatch.putMetricData(params, (err, data) => {
        if (err) {
          throw new Error(err);
        }
        console.log('metrics successfully published to cloudwatch');
      });
  });
};