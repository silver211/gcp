const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');

const app = express();
app.use(cors());

const port = 3001;

const storage = new Storage({
    keyFilename:`./key.json`
});

const bucketName = 'svdassets'; // Replace with your bucket name

const bucket = storage.bucket(bucketName);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', (err) => {
    console.error(err)
    res.status(500).send('Error uploading file.');
  });

  blobStream.on('finish', () => {
    blob.makePublic(async function (err) {
        if (err) {
          console.error(`Error making file public: ${err}`)
          res.status(200).send('File uploaded. Public failed');
        } else {
          console.log(`File is now public.`)
          const publicUrl = blob.publicUrl()
          console.log(`Public URL : ${publicUrl}`)
          res.status(200).send({'status':'success','url':publicUrl})
        }
       })
   
  });

  blobStream.end(req.file.buffer);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
