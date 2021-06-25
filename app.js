const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

const workItem = [];

app.set("view engine", "ejs");

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

//DataBase

mongoose.connect("mongodb+srv://admin-ayush:ayush123@cluster0.ssgy2.mongodb.net/todolistDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const itemsShema = {
    name: String
};

const Item = mongoose.model("Item", itemsShema);

const item1 = new Item({
    name: "Welcome to your Todo's list"
})
const item2 = new Item({
    name: "Hit the + button to add new items"
})
const item3 = new Item({
    name: "<--- Hit this button to delete item"
})

const DefaultItems = [item1, item2, item3];

const listShema = {
    name: String,
    items: [itemsShema]
}

const List = mongoose.model("List", listShema)


//DataBase End
app.get("/", function (req, res) {
    Item.find({}, function (err, foundItem) {

        //it sees that foundItem contain any items or not if not then
        //it runs the below code and if it contains the items then they render
        if (foundItem.length === 0) {
            Item.insertMany(DefaultItems, function (err) {
                if (err) {
                    console.log("error")
                } else {
                    console.log("successfull!!")
                }
                res.redirect("/")
            })
        } else {
            res.render("list", { listTitle: "Today", newlistItem: foundItem });
        }
    })

});

//coustom List
app.get("/:Listname", function (req, res) {
    const Listname = _.capitalize(req.params.Listname);

    List.findOne({ name: Listname }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: Listname,
                    items: DefaultItems
                })
                list.save();
                res.redirect("/" + Listname)
            } else {
                res.render("list", { listTitle: foundList.name, newlistItem: foundList.items });
            }
        }
    })
})

app.post("/", function (req, res) {

    const newItem = req.body.newitem;
    const listName = req.body.list;

    const item = new Item({
        name: newItem
    })
    
    if (listName === "Today"){
        item.save();
        res.redirect("/");
    } else{
        //for Coustom List
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName );       
         })
    }
});

//to delete items 
app.post("/delete", function (req, res) {
    const checkedIdItem = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedIdItem, function (err) {
            if (!err) {
                res.redirect("/")
            }
        });
    } else {
        // Here when we create a coustom list it gets saved into new array 
        //Here we are finding that particular array and deleting the item we have selected
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkedIdItem}}}, function(err, foundList){
            if (!err){
                res.redirect("/" + listName)
            }
        })
    }
});


app.listen(process.env.PORT || 3000, function () {
    console.log("server is running on port 3000")
});