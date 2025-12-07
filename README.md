# Storymaker Actor

This repository contains the code for the Storymaker Actor, which is a demonstration Actor for how to use schemas on Apify platform.
Each version introduces new features and improvements to showcase the capabilities of Apify Actors.

Branch v0 - Initial release with basic functionality and implemented `actor.json` file.

Branch v1 - Added `input_schema.json`, to provide structured and validated input for the Actor.

Branch v2 - Implemented `dataset_schema.json` to define the structure of the data in dataset and to present the chapters in more user-friendly views.

Branch v3 - Implemented `key_value_store_schema.json` to separate the items in key-value store in more user-friendly collections.

Branch v4 - Added `output_schema.json` to present all available output to the user.

Branch v5 - Implemented API running inside the Actor and added `web_server_schema.json` to define the endpoints and their responses.

Branch v6 - Implemented live view as a new output option to provide real-time updates during the Actor run.

Branch v7 - Added option to use named storages to allow users to continue work from previous runs and manage multiple projects.