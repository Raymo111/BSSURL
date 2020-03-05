"use strict";

const Hapi = require("@hapi/hapi");
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const adapter = new FileAsync('db.json');
const apiPrefix = "/api/v1";

const config = require("./config");

const init = async () => {
    const db = await low(adapter);

    // Initialize the database (if it doesn't exist)
    await db.defaults({ urls: [] }).write();

    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: "localhost"
    });

    await server.register(require('inert'));

    // Return all URL Mappings
    server.route({
        method: "GET",
        path: apiPrefix + "/slug",
        handler: async (request, h) => {
            return db.get("urls");
        }
    });

    // Return single mapping (matching slug) if it exists, otherwise return false.
    server.route({
        method: "GET",
        path: apiPrefix + "/slug/{slug}",
        handler: async (request, h) => {
            let url = db.get("urls").find({slug: request.params.slug}).value();
            return url ? url : false;
        }
    });

    // Add a new URL Mapping to the database
    server.route({
        method: "POST",
        path: apiPrefix + "/slug",
        handler: async (request, h) => {
            // First check if it exists already...
            if(db.get("urls").find({slug: request.payload.slug}).value() !== undefined) {
                // Already exists, fail.
                return h.response(false).code(553);
            } else {
                // Then add it to the database
                console.log("Adding new URL Mapping: " + JSON.stringify(request.payload));
                await db.get("urls").push(request.payload).write();
                return h.response(true).code(201);
            }
        }
    });

    // ~ Administration Routes ~

    // Delete a URL Mapping
    server.route({
        method: "DELETE",
        path: apiPrefix + "/slug",
        handler: async (request, h) => {
            if(config.apiKey === request.payload.apiKey) {

            }
        }
    });


    // ~ Public ~
    // Routes matching slug.
    server.route({
        method: "GET",
        path: "/{slug}",
        handler: async (request, h) => {
            let url = db.get("urls").find({slug: request.params.slug}).value();
            console.log(url);
            if(url !== undefined) {
                return h.redirect(url.dest);
            } else {
                return "Not Found";
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'public/'
            }
        }
    });

    await server.start();
    console.log("BSSURL Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
    console.error("BSSURL Server has run into an unexpected error...");
    console.error(err);
    process.exit(1);
});

init().then(() => {
    console.log("Ready!");
});
