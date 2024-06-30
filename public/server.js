const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const pdf = require("html-pdf");
const QRCode = require("qrcode");
const path = require("path");

// Initialize Express
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema
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

// Endpoint to handle form submission
app.post("/submit", async (req, res) => {
  const { name, age, aadhaar, email, numAdults, numKids, date } = req.body;
  const timestamp = new Date();

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

  // Calculate total price
  const totalPrice = numAdults * 50 + numKids * 30;

  try {
    await newVisitor.save();

    // Generate QR code
    const qrData = `Name: ${name}, Age: ${age}, Aadhaar: ${aadhaar}, Email: ${email}, Adults: ${numAdults}, Kids: ${numKids}, Date: ${date}, Timestamp: ${timestamp}, Amount Paid: ₹${totalPrice}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Generate PDF
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

        // Send email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "hitenghadge281103@gmail.com", // Replace with your email
            pass: "Pass@123", // Replace with your email password
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

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
