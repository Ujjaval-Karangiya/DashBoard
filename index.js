require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const { faker } = require("@faker-js/faker");
const { v4: uuid } = require("uuid");
const { Client } = require("pg");

const app = express();
const port = 8080;

// Models
const PostChat = require("./models/postchat");
const Chat = require("./models/chat");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================================================
   MONGODB CONNECTION
========================================================= */

async function connectMongoDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB Connected");
    } catch (err) {
        console.log("MongoDB Error:", err);
    }
}

connectMongoDB();

/* =========================================================
   POSTGRESQL CONNECTION
========================================================= */

const connection = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

connection
    .connect()
    .then(() => console.log("PostgreSQL Connected"))
    .catch((err) => console.log("PostgreSQL Error:", err));

/* =========================================================
   HOME PAGE
========================================================= */

app.get("/posts", async (req, res) => {
    try {
        const q = "SELECT * FROM posts ORDER BY id DESC";

        const result = await connection.query(q);

        const posts = result.rows;

        res.render("index.ejs", { posts });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   CHAT PAGE
========================================================= */

app.get("/posts/chat", async (req, res) => {
    try {
        const chats = await Chat.find();

        res.render("chat_page.ejs", { chats });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   CREATE NEW CHAT PAGE
========================================================= */

app.get("/posts/chat/new_chat", (req, res) => {
    res.render("new_chat.ejs");
});

/* =========================================================
   CREATE CHAT
========================================================= */

app.post("/posts/chat", async (req, res) => {
    try {
        const { from, to, msg } = req.body;

        const newChat = new Chat({
            from,
            to,
            msg,
            created_at: new Date()
        });

        const savedChat = await newChat.save();

        console.log(savedChat);

        res.redirect("/posts/chat");

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   EDIT CHAT PAGE
========================================================= */

app.get("/posts/chat/:id/edit", async (req, res) => {
    try {
        const { id } = req.params;

        const chats = await Chat.findById(id);

        res.render("edit_chat.ejs", { chats });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   UPDATE CHAT
========================================================= */

app.put("/posts/chat/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { msg: newmsg } = req.body;

        const updatedMsg = await Chat.findByIdAndUpdate(
            id,
            { msg: newmsg },
            { runValidators: true, new: true }
        );

        console.log(updatedMsg);

        res.redirect("/posts/chat");

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   DELETE CHAT
========================================================= */

app.delete("/posts/chat/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedChat = await Chat.findByIdAndDelete(id);

        console.log(deletedChat);

        res.redirect("/posts/chat");

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   OPEN POST CHAT
========================================================= */

app.get("/posts/:id/chat", async (req, res) => {
    try {
        const { id } = req.params;

        const messages = await PostChat.find({ postId: id });

        res.render("post_chat.ejs", {
            postId: id,
            messages
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   CREATE POST CHAT
========================================================= */

app.post("/posts/:id/chat", async (req, res) => {
    try {
        const { id } = req.params;

        const { from, msg } = req.body;

        await PostChat.create({
            postId: id,
            from,
            msg
        });

        res.redirect(`/posts/${id}/chat`);

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   DELETE POST CHAT
========================================================= */

app.delete("/posts/:postId/chat/:msgId", async (req, res) => {
    try {
        const { postId, msgId } = req.params;

        await PostChat.findByIdAndDelete(msgId);

        res.redirect(`/posts/${postId}/chat`);

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   CREATE POST PAGE
========================================================= */

app.get("/posts/new", (req, res) => {
    res.render("new.ejs");
});

/* =========================================================
   CREATE POST
========================================================= */

app.post("/posts/new", async (req, res) => {
    try {
        const {
            username,
            content,
            img,
            Number,
            age,
            city,
            district,
            state,
            country,
            dob,
            hostel,
            study,
            hobby
        } = req.body;

        const id = uuid();

        const q = `
            INSERT INTO posts
            (
                id,
                username,
                content,
                img,
                Number,
                age,
                city,
                district,
                state,
                country,
                dob,
                hostel,
                study,
                hobby
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
            )
        `;

        const values = [
            id,
            username,
            content,
            img,
            Number,
            age,
            city,
            district,
            state,
            country,
            dob,
            hostel,
            study,
            hobby
        ];

        await connection.query(q, values);

        res.redirect("/posts");

    } catch (error) {
        console.log(error);
        res.status(500).send("Something Went Wrong");
    }
});

/* =========================================================
   SHOW POST DETAILS
========================================================= */

app.get("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const q = `SELECT * FROM posts WHERE id = $1`;

        const result = await connection.query(q, [id]);

        const post = result.rows[0];

        res.render("show.ejs", { post });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   EDIT PAGE
========================================================= */

app.get("/posts/:id/edit", async (req, res) => {
    try {
        const { id } = req.params;

        const q = `SELECT * FROM posts WHERE id = $1`;

        const result = await connection.query(q, [id]);

        const post = result.rows[0];

        res.render("edit.ejs", { post });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   UPDATE POST
========================================================= */

app.patch("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            content,
            Number,
            age,
            city,
            district,
            state,
            country,
            dob,
            hostel,
            study,
            hobby
        } = req.body;

        const q = `
            UPDATE posts
            SET
                content = $1,
                Number = $2,
                age = $3,
                city = $4,
                district = $5,
                state = $6,
                country = $7,
                dob = $8,
                hostel = $9,
                study = $10,
                hobby = $11
            WHERE id = $12
        `;

        const values = [
            content,
            Number,
            age,
            city,
            district,
            state,
            country,
            dob,
            hostel,
            study,
            hobby,
            id
        ];

        await connection.query(q, values);

        res.redirect("/posts");

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   DELETE POST
========================================================= */

app.delete("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const q = `DELETE FROM posts WHERE id = $1`;

        await connection.query(q, [id]);

        res.redirect("/posts");

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

/* =========================================================
   SERVER
========================================================= */

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});