# serverless-galleria

Serverless batch manipulation and publishing - Warning this is a WIP expect errors and changes.

### Transformations
A transform owns an S3 bucket, which it watches for incoming files.  When files are added, it runs a lambda function to transform the images and place them in another S3 bucket

![transform](diagrams/transform.png)

* [compress](compress) - Apply the transform to markdownthe file

## Setup
First, plan your pipeline, as you'll build it backwards.  Here's a sample:

![pipeline](diagrams/pipeline.png)

### Steps
1. Deploy Application
    1.a S3 bucket bucket must already exist, as it's not owned by any transformations
    1.b Deploy the transform, with the tobetransformed bucket as its source, and markdown bucket as its destination
## License
Inspired by &copy; 2017-2018 [Evan Chiu](https://evanchiu.com). This project is available under the terms of the MIT license.

## To Do
Renaming from compress to markdown.
Code the markdown transformation.
Write to output bucket in put into test harness before gatsby site uses markdown files
