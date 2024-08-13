const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const app = express();


app.use(bodyParser.urlencoded({extended:true})); // for request post
app.use(express.static("public"));
app.set('view engine', 'ejs');

const uri = "mongodb+srv://admin_stark:Test1234@cluster0.zrfz0.mongodb.net"
mongoose.connect(uri + '/tasksDB',{
  maxPoolSize: 50 ,
  serverSelectionTimeoutMS: 120000, 
  socketTimeoutMS: 180000 
});

const itemSchema = {
    name:String
};

const listSchema = {
    name: String,
    list: [itemSchema]
}

const Item = mongoose.model("Item",itemSchema);

const List = mongoose.model("list",listSchema);

const item1 = new Item({
    name:'Pray'
});

const item2 = new Item({
    name:'Eat'
});

const defaultItems = [item1, item2];

app.get("/", function(req,res) {

    // console.log("Start on /");
    

    Item.find({}).then((foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems);
            res.redirect("/");
        }else{
            res.render("list",{
                listTitle: "Today",
                tasks: foundItems
            });
        }
    });
});

app.post("/", async function(req,res) {

    let item = req.body.task;
    let listName = req.body.list;

    let newTask = new Item({
        name: req.body.task
    });

    if(req.body.list === "Today"){
        newTask.save();
        res.redirect("/");
    }else{
        try {
            const doc = await List.findOne({name: listName}); //check if it exists
            doc.list.push(newTask);
            doc.save();
            res.redirect("/" + doc.name);
        } catch (err) {
            console.error(err);
        }
        
    }  
});

app.post("/delete", async (req, res) => {
    try {
        const task_to_delete = req.body.checkbox;
        const list = req.body.listName;
        
        if(list === "Today"){
            const deletedItem = await Item.findOneAndDelete({ _id: task_to_delete });
            if (deletedItem) {
                console.log("Deleted item: ", deletedItem);
            } else {
                console.log("No item found to delete");
            }
            res.redirect("/");
        }else{
            
            const updatedItem = await List.findOneAndUpdate({ name: list }, 
                {
                    $pull: {
                        list: {
                            _id: task_to_delete
                        }
                    }
                },
                { new: true, runValidators: true });
            if (updatedItem) {
                console.log("updated item: ", updatedItem);
            } else {
                console.log("No item found to delete");
            }
            res.redirect("/"+list);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Error deleting item");
    }

    
});

app.get("/:newList", async function(req,res){
    // console.log("start on /....");
    
    const newL = _.capitalize(req.params.newList);
    if(newL === "Favicon.ico"){
        // console.log("Faviiii");
        
    }else{
        try {
            const doc = await List.findOne({name: newL}); //check if it exists
            if (doc) {
                res.render("list",{
                    listTitle: newL,
                    tasks: doc.list
                });
            } else {
                const list = new List({
                name: newL,
                list: defaultItems
            });
            list.save();
            res.redirect("/"+newL);
            }
        } catch (err) {
            console.error(err);
        }
    }
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Port on");
});
