
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true , useUnifiedTopology: true ,useFindAndModify: false});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Mood is"
});

const item3 = new Item({
  name: "Good"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res)=> {

  Item.find({}, (err, foundItems)=> {

    if(foundItems.length === 0) {

      Item.insertMany(defaultItems, function(err){
         if(err){
           console.log(err);
         }else{
           console.log("Successfully saved default items into collection!");
         }
      });
      res.redirect("/");
    } else{
      //console.log(foundItems);
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", (req,res)=> {

  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}, function (err, foundList){

    if(!err) {
      if(!foundList) {
        //console.log("Doesn't exist!");
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
    }else {
      //console.log("Exist!");
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
   }
  });  
});

app.post("/", (req, res)=>{

  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(req.body.newItem);

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  } 
});
  
app.post("/delete", (req, res) => {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }
});

app.get("/about", (req, res)=>{
  res.render("about");
});

app.listen(5000, ()=> {
  console.log("Server started on port 5000");
});
