# Update a database

The database server stores pictures, but it doesn't change them once they are stored. In this exercise we are going to add a view counter to each picture. Each time someone views a picture, the server adds one to the counter for that picture and saves the new value in the database. The view page then shows how many times the picture has been viewed.

To do this we need to add something new to the information we store about each picture. But we already have pictures in the database, and they were stored without a counter. We'll see how to change the schema without breaking the pictures that are already there.

## Make the program

The finished program is **db_counter_server.js** in the **code/tiny_db_server** folder. It is a copy of **db_image_server.js** with two changes. If you want to make the changes yourself, start by making a copy of the database server:

```bash
cd code/tiny_db_server
cp db_image_server.js db_counter_server.js
```

Then open **db_counter_server.js** in your editor.

### Change 1: add the counter to the schema

```javascript
const pictureSchema = new mongoose.Schema({
    phrase: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    // New in this version - pictures stored before it was added get the default
    views: { type: Number, default: 0 }
});
```

The schema has a new field called **views**, which holds a number. Don't forget the comma at the end of the **uploadedAt** line.

The important part is `default: 0`. When the server stores a new picture, it doesn't give a value for **views**, so the default value of 0 is used. The default also helps when mongoose reads a picture that was stored before we added the counter. That picture has no **views** value in the database, so mongoose fills in the default. As far as the program is concerned, every picture has a view count, and an old picture just hasn't been viewed yet.

### Change 2: count each view

```javascript
app.get("/view/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).send("Picture not found");
        return;
    }

    picture.views = picture.views + 1;
    await picture.save();

    res.send(`
        <html>
            <body>
                <img src="/picture/${picture.phrase}">
                <p>Views: ${picture.views}</p>
            </body>
        </html>
    `);
});
```

This is the view page from the database server with three new lines. After the server has found the picture in the database, it adds one to the **views** value. Then it calls `save` to write the changed picture back to the database. Like all the database requests, this takes time, so we `await` it. Finally the page shows the number of views underneath the picture.

## Run the program

If the database server from the previous howto is still running, press **CTRL+C** to stop it. Then start the new one:

```bash
node db_counter_server.js
```

Now view one of the pictures you uploaded in the previous howto, such as **http://localhost:3000/view/copper-storm-warbler**. Underneath the duck you'll see:

```
Views: 1
```

Refresh the page and the count goes up to 2. Each time you refresh, the browser asks for the page again and the server adds another view. The pictures that you stored before the change work with the new program, because of the default value.

Upload a new picture with **db_image_upload.py** and view it. Its count starts at 1 too.

## Look inside the database

Log in to the database and look at the pictures:

```bash
docker exec -it mongodb mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

```javascript
db.examplepictures.find()
```

You'll see three kinds of picture:

* A picture you uploaded **before** the change and have **viewed** since. It now has a **views** value. MongoDB added it to the document the first time the picture was saved.
* A picture you uploaded **before** the change but **haven't viewed** since. It still has no **views** value. Nothing has changed this document, and it doesn't need to change. Mongoose fills in the default when it reads the document.
* A picture you uploaded **after** the change. It was stored with **views** set to 0, and it goes up each time the picture is viewed.

So we changed what we store about pictures without having to change any of the pictures already in the database. MongoDB doesn't mind if documents in the same collection have different fields, so you can add new fields as your program grows. But your program must know what to do when a field is missing, and that's what the default value is for.

## What happens without a default?

You can see why the default matters by taking it out. Stop the server, change the **views** line in the schema to this, and start the server again:

```javascript
    views: { type: Number }
```

New pictures still work. But if you view a picture that was stored before the change and hasn't been viewed since, you'll get an error page that starts like this:

```
ValidationError: Picture validation failed: views: Cast to Number failed for value "NaN" (type number) at path "views"
```

The picture has no **views** value, so in JavaScript `picture.views` is `undefined`. Adding one to `undefined` gives **NaN**, which stands for "Not a Number". Mongoose won't put a value that isn't a number into a **Number** field, so `save` fails and the page can't be shown. The pictures that people had stored before the change suddenly stop working.

Put `default: 0` back before you carry on. Whenever you add a field to a schema, think about the documents that are already in the database, and give the field a default value that makes sense for them.

## A better way to count

The program reads the count, adds one and then saves it. If two people view the same picture at exactly the same moment, they could both read a count of 5, both add one and both save 6. One of the views would be lost. For a picture server on a Raspberry Pi this doesn't matter much, but the database can do the adding itself, which avoids the problem:

```javascript
const picture = await Picture.findOneAndUpdate(
    { phrase: req.params.phrase },
    { $inc: { views: 1 } },
    { new: true }
);
```

This tells MongoDB to find the picture and **inc**rease its **views** value by 1, all in one step, and then send back the updated picture (`new: true`). It also works for pictures that don't have a **views** value, because MongoDB starts the count at 0. You can try replacing the `findOne` and `save` in the view page with this.

## What next?

The view page is a string of HTML with values from the database dropped into it. That's fine for one or two values, but it gets messy as pages grow. Next we'll [use Express to render pages](/doc/08%20Use%20Express%20to%20render%20pages.md), which is a much better way to show the information in each document.

[home](/README.md)
