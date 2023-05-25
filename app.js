//jshint esversion:6


const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-martial:test123@cluster0.bfqglt7.mongodb.net/todolistDb")
  .then(()=>{
    console.log("Successfully connected to database");
  })
  .catch((err) => {
    console.log("Connection error: " + err);
  });
  const itemsSchema = new mongoose.Schema({
    name: String
  });
  const Item = mongoose.model('Item', itemsSchema);

  const item1 = new Item({
    name: "Welcome to your todolist!"
  });
  const item2 = new Item({
    name:"Hit the + button to add a new item."
  });
  const item3 = new Item({
    name: "<-- Hit this to delete an item."
  });
  const defaultItems = [item1,item2,item3];
  const allItems = Item.find({});

  const listSchema = new mongoose.Schema({
    name : String,
    items : [itemsSchema]
  });
  const List = mongoose.model("List",listSchema);
  
app.get("/", function(req, res) {

  Item.find().then(function (Items){
    if (Items.length === 0) {
      Item.insertMany(defaultItems)
      .then(function () {
        console.log("Successfully saved default items to DB");
      }).catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: Items});
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name : customListName})
  .then((foundList)=>{
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
      console.log("Doesn't exist");
    }else{
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      console.log("exist");
      
    }   
  })
  .catch((err)=>console.log("An error occurred:", err));
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    if(checkedItemId != undefined){
      await Item.findByIdAndRemove(checkedItemId)
        .then(()=>console.log(`Deleted ${checkedItemId} Successfully`))
        .catch((err) => console.log("Deletion Error: " + err));
      res.redirect("/");
    }
    
  } else {
    List.findOneAndUpdate({name : listName},{$pull: {items:{_id:checkedItemId}}})
    .then(()=>{
      res.redirect("/" + listName);
    })
    .catch((err) => console.log("Deletion Error: " + err));
  }
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
    .then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch((err) => console.log("Deletion Error: " + err));

  }
});
 
app.listen(3000, function() {
  console.log("Server started on port 3000");
});