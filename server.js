const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const pdf = require("html-pdf");
const QRCode = require("qrcode");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

console.log("here 1");
mongoose
  .connect("mongodb://127.0.0.1:27017/hackathon", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("database connected"));
console.log("here 2");

const visitorSchema = new mongoose.Schema({
  name: String,
  age: Number,
  aadhaar: String,
  email: String,
  numAdults: Number,
  numKids: Number,
  date: String,
  timestamp: Date,
});

const Visitor = mongoose.model("Visitor", visitorSchema);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/", async (req, res) => {
  const { name, age, aadhaar, email, numAdults, numKids, date } = req.body;
  const timestamp = new Date();

  console.log("here");

  console.log(email);
  console.log(age);
  console.log(name);
  console.log(aadhaar);
  console.log(numAdults);

  const newVisitor = new Visitor({
    name,
    age,
    aadhaar,
    email,
    numAdults,
    numKids,
    date,
    timestamp,
  });

  const totalPrice = numAdults * 50 + numKids * 30;

  try {
    await newVisitor.save();

    const qrData = `Name: ${name}, Age: ${age}, Aadhaar: ${aadhaar}, Email: ${email}, Adults: ${numAdults}, Kids: ${numKids}, Date: ${date}, Timestamp: ${timestamp}, Amount Paid: ₹${totalPrice}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const htmlContent = `
            <h1>Museum Ticket</h1>
            <p>Name: ${name}</p>
            <p>Age: ${age}</p>
            <p>Aadhaar: ${aadhaar}</p>
            <p>Email: ${email}</p>
            <p>Number of Adults: ${numAdults}</p>
            <p>Number of Kids: ${numKids}</p>
            <p>Date of Visit: ${date}</p>
            <p>Timestamp: ${timestamp}</p>
            <p>Total Amount Paid: ₹${totalPrice}</p>
            <img src="${qrCode}" alt="QR Code"/>
        `;

    pdf
      .create(htmlContent)
      .toFile(path.join(__dirname, "ticket.pdf"), async (err, resPdf) => {
        if (err) return console.log(err);

        const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 465,

          auth: {
            user: "tstushar02@gmail.com",
            pass: "swpb awmm maxi erhw",
          },
        });

        const mailOptions = {
          from: "tstushar02@gmail.com",
          to: email,
          subject: "Your Museum Ticket",
          text: "Please find attached your ticket for the museum.",
          attachments: [
            {
              filename: "ticket.pdf",
              path: resPdf.filename,
            },
          ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            res.status(500).send("Error sending email");
          } else {
            console.log("Email sent: " + info.response);
            res.status(200).send("Ticket generated and email sent");
          }
        });
      });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error processing your request");
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
