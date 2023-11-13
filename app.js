const express = require('express');
const bodyParser = require('body-parser');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs');
const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get('/favicon.ico', (req, res) => {
    res.sendStatus(204);
});

app.post('/webhook', async (req, res) => {
    // Extract the file from the request
    // This depends on how the file is sent in the request
    const filePath = '1_updated_ConstanciaFiscalOECG.pdf';

    const projectId = 'documentprincipal';
    const location = 'us';
    const processorId = '69de61eeb827ed15';

    const document = await processDocument(projectId, location, processorId, filePath);
    console.log(document);

    // Send a response back to Dialogflow
    // You might want to format this response so that it can be displayed nicely in Facebook Messenger
    res.json({ fulfillmentText: 'Document processed successfully!', document: document });
});

async function processDocument(projectId, location, processorId, filePath) {
    // Instantiates a client
    const documentaiClient = new DocumentProcessorServiceClient();

    // The full resource name of the processor
    const resourceName = documentaiClient.processorPath(projectId, location, processorId);

    // Read the file into memory.
    const imageFile = fs.readFileSync(filePath);

    // Determine the MIME type based on the file extension
    const extension = filePath.split('.').pop();
    let mimeType;
    switch (extension) {
        case 'pdf':
            mimeType = 'application/pdf';
            break;
        case 'png':
            mimeType = 'image/png';
            break;
        case 'jpg':
        case 'jpeg':
            mimeType = 'image/jpeg';
            break;
        case 'tiff':
            mimeType = 'image/tiff';
            break;
        default:
            throw new Error(`Unsupported file extension: ${extension}`);
    }

    // Load Binary Data into Document AI RawDocument Object
    const rawDocument = {
        content: imageFile,
        mimeType: mimeType,
    };

    // Configure ProcessRequest Object
    const request = {
        name: resourceName,
        rawDocument: rawDocument
    };

    // Use the Document AI client to process the sample form
    const [result] = await documentaiClient.processDocument(request);

    return result.document;
}

app.listen(3000, () => {
    console.log('Webhook is running on port 3000');
});
