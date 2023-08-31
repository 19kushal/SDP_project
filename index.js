const express = require("express");
const app = express();
const path = require("path");
const logger = require("morgan");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const session = require("express-session");
require("dotenv").config();

const User = require("./models/user");
const Admin = require("./models/admin");
// const Announcement = require("./models/announcement");
const Complaint = require("./models/complaint");
const Notice = require("./models/notice");
const Announcement = require("./models/announcement");
const complaint = require("./models/complaint");
const { request } = require("http");
const admin = require("./models/admin");
const user = require("./models/user");
const { error } = require("console");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

//SESSION
app.use(
  session({
    cookie:{
      path:'/',
      httpOnly: false
    },
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

//Storage
const Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads")
  },
  filename: (req, file, cb) => {
    cb(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    )
  }
})
const upload = multer({
  storage: Storage
}).single('filename')

//MONGODB connection
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => console.log("MONGODB connected"))
  .catch((error) => console.log(error));



// COntrollers
// get main page 
app.get("/",(req,res) =>{
  res.render("index.ejs")
})
// 1.Signup
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get("/admin-signup", (req, res) => {
    res.render("admin-signup.ejs");
});

// 2. Signup Post (tested)
app.post("/signup", async (req, res) => { 

  try {
    const user = new User({
      // createdBy: _id,
      name: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      wing: req.body.wing,
      floor: req.body.floor,
      flat: req.body.flat,
      resiType: req.body.resiType,
      password: req.body.password,
    });
    await user.save();
    console.log("USer Created");
    res.redirect("/login")
    
  } catch(err){
    console.log(err)
    res.redirect("/signup")
  }
});
// (tested)
app.post("/admin-signup", async (req, res) => {
  try {
    const admin = new Admin({
      name: req.body.name,
      email: req.body.email,
      designation: req.body.designation,
      contact: req.body.contact,
      password: req.body.password,
    });
    await admin.save();
    console.log("admin Created");
    res.redirect("/admin-login");
  } catch(err) {
    console.log(err)
    res.redirect("/admin-signup");
  }
});



//Login GET
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

//Admin Login GET
app.get("/admin-login", (req, res) => {
  res.render("adminLogin.ejs");
});


// Login Post (tested)
app.post("/login", async (req, res) => {
  await User.find({ email: req.body.email })
    .then((data) => {
      if (req.body.password == data[0].password) {
        req.session.user = data[0];
        res.redirect("/userPanel");
      } else {
        res.redirect("/login");
      }
    })
    .catch((error) => {
      console.log(error);
      res.redirect("/signup");
    });
});

//Admin Login POST (tested)
app.post("/admin-login", async (req, res) => {
  await Admin.find({ email: req.body.email })
    .then((data) => {
      if (req.body.password == data[0].password) {
        req.session.user = data[0]
        res.redirect("/adPanel");
        
      } else {
        res.redirect("/admin-login");
        // res.json({
        //     status: "Admin Login failed"
        // })
      }
    })
    .catch((error) => {
      console.log(error);
      res.redirect("/admin-signup");
    // res.json({
    //     status: "Admin should register to login"
    // })
    });
});
// get resident 
app.get("/residents", async(req,res)=>{
  await User.find({userId: req.session._id}).then(users=>{
    console.log(users)
    res.render("residents.ejs",{
      users: users
    })
  })
})
// admin panel 
app.get("/adPanel", checkAuth, async (req, res) => {
  await Admin.findOne({_id: req.session.user._id}).then(adminData=>{
    console.log(adminData)
    res.render("admin.ejs",{
      admins: adminData
    })
  })
})
// user panel 
app.get("/userPanel", checkAuth, async (req,res)=>{
     await User.findOne({_id: req.session.user._id}).then(userData=>{
      console.log(userData)
       res.render('user.ejs',{ user: userData})
      })
})

// Notice page get 
app.get("/ntsPanel", async (req, res) => {
  await Notice.find().then(notice => {
      res.render("notice.ejs", {
          nts: notice
      }) 
  })
})

// ADMIN Notice page get 
app.get("/ad-ntsPanel", async (req, res) => {
  await Notice.find().then(notice => {
      res.render("ad-notice.ejs", {
          nts: notice
      }) 
  })
})

// add Notice (tested)
app.post("/addNotice", upload, async (req, res) => {
  try {
    const notice = new Notice({
      title: req.body.title,
      content: req.body.content,
      image: req.file.filename,
      link: req.body.link,
    });
    await notice.save();
    console.log("notice added");
    res.redirect("/ntsPanel");

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

// add Notice (tested)
app.post("/ad-addNotice", upload, async (req, res) => {
  try {
    const notice = new Notice({
      title: req.body.title,
      content: req.body.content,
      image: req.file.filename,
      link: req.body.link,
    });
    await notice.save();
    console.log("notice added");
    res.redirect("/ad-ntsPanel");

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});
//DELETE Notice(tested)
app.post("/delete-notice/:id", async (req, res) => {
  await Notice.findOneAndDelete({ _id: req.params.id })
    .then((result) => {
      if (result) {
        console.log("Notice Deleted");
        res.redirect("/ad-ntsPanel");
      } else{
      }
    })
    .catch((e) => {
      console.log(e);
      res.send("Error in deleting notice");
    });
});

//Complaint Panel GET
app.get("/comPanel", async (req, res) => {
  await Complaint.find().then(complaint => {
      res.render("complaint.ejs", {
          comps: complaint
      }) 
  })
})

// admin complaint panel 
app.get("/ad-comPanel", async (req, res) => {
  await Complaint.find().then(complaint => {
      res.render("ad-complaint.ejs", {
          comps: complaint
      }) 
  })
})
// add Complaint(tested)
app.post("/addComplaint", upload, async (req, res) => {
  try {
    if(!req.file){
      const complaint = new Complaint({
        title: req.body.title,
      content: req.body.content,
      // image: req.file.filename,
      link: req.body.link,
    });
    await complaint.save();
    console.log("Complaint added");
    res.redirect("/comPanel");
  } else{
    const complaint = new Complaint({
      title: req.body.title,
    content: req.body.content,
    image: req.file.filename,
    link: req.body.link,
  });
  // image = '';
  await complaint.save();
  console.log("Complaint added");
  res.redirect("/comPanel");
  }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

// add ADMIN Complaint(tested)
app.post("/ad-addComplaint", upload, async (req, res) => {
  try {
    if(!req.file){
      const complaint = new Complaint({
        title: req.body.title,
      content: req.body.content,
      // image: req.file.filename,
      link: req.body.link,
    });
    await complaint.save();
    console.log("Complaint added");
    res.redirect("/ad-comPanel");
  } else{
    const complaint = new Complaint({
      title: req.body.title,
    content: req.body.content,
    image: req.file.filename,
    link: req.body.link,
  });
  // image = '';
  await complaint.save();
  console.log("Complaint added");
  res.redirect("/ad-comPanel");
  }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

//DELETE Complaint(tested)
app.post("/delete-complaint/:id", async (req, res) => {
    await Complaint.findOneAndDelete({ _id: req.params.id })
      .then((result) => {
        if (result) {
          console.log("Complaint Deleted");
          res.redirect("/ad-comPanel");
        } else{
          
        }
      })
      .catch((e) => {
        console.log(e);
        res.send("Error in deleting complaint");
      });
  });

//Announcement Panel GET
app.get("/anPanel", async (req, res) => {
  await Announcement.find().then(announcement => {
      res.render("announcement.ejs", {
          annas: announcement
      }) 
  })
})
//Admin Announcement Panel GET
app.get("/ad-anPanel", async (req, res) => {
  await Announcement.find().then(announcement => {
      res.render("ad-announcement.ejs", {
          annas: announcement
      }) 
  })
})

// add Announcement
app.post("/addAnnouncement", upload, async (req, res) => {
  try {
    const announcement = new Announcement({
      title: req.body.title,
      content: req.body.content,
      image: req.file.filename,
      link: req.body.link,
    });
    await announcement.save();
    console.log("announcement added");
    res.redirect("/anPanel");
  } catch (err) {
    console.log(err);
    res.json({
      status: "error in adding Announcement"
    })
    res.send(err);
  }
});

// add Announcement for admin
app.post("/ad-addAnnouncement", upload, async (req, res) => {
  try {
    const announcement = new Announcement({
      title: req.body.title,
      content: req.body.content,
      image: req.file.filename,
      link: req.body.link,
    });
    await announcement.save();
    console.log(" Admin announcement added");
    res.redirect("/ad-anPanel");
  } catch (err) {
    console.log(err);
    res.json({
      status: "error in adding Announcement"
    })
    res.send(err);
  }
});

//DELETE Announcement
app.post("/delete-announcement/:id", async (req, res) => {
  await Announcement.findOneAndDelete({ _id: req.params.id })
    .then((result) => {
      if (result) {
        console.log("Announcement removed");
        res.redirect("/ad-anPanel");
      }
    })
    .catch((e) => {
      console.log(e);
      res.send("Error in deleting announcement");
    });
});

//Logout
app.post("/logout", checkAuth, (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//MIDDLEWARE
function checkAuth(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/");
  }
}

let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening on port 3000");
});
