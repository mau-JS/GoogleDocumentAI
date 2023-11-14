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
    const filePath = '1_updated_ConstanciaFiscalOECG.pdf';
    const projectId = 'documentprincipal';
    const location = 'us';
    const processorId = 'ec2a4b2ae9b1054e';

    const document = await processDocument(projectId, location, processorId, filePath);
    console.log(document);

    // Extract entities from the document
    const entities = document.entities.map(entity => `${entity.type}: ${entity.mentionText}`);

    // Create a Dialogflow-compatible response
    const dialogflowResponse = {
        fulfillmentMessages: [
            {
                text: {
                    text: [
                        `${entities.join(', ')}.`
                    ]
                }
            }
        ]
    };

    res.json(dialogflowResponse);
});

async function processDocument(projectId, location, processorId, filePath) {
    const documentaiClient = new DocumentProcessorServiceClient();
    const resourceName = documentaiClient.processorPath(projectId, location, processorId);
    const imageFile = fs.readFileSync(filePath);
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
    const rawDocument = {
        content: imageFile,
        mimeType: mimeType,
    };
    const request = {
        name: resourceName,
        rawDocument: rawDocument
    };
    const [result] = await documentaiClient.processDocument(request);
    return result.document;
}

app.listen(3000, () => {
    console.log('Webhook is running on port 3000');
});
