require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator'); // Tambahkan express-validator

const { createClient: createStorageClient } = require('@supabase/storage-js');

const app = express();
const port = process.env.PORT || 5000;

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const storageClient = createStorageClient(supabaseUrl, {
    apikey: supabaseKey,
    global: { headers: { Authorization: `Bearer ${supabaseKey}` } },
});

// Middleware
const allowedOrigins = ['http://your-frontend-domain.com']; // Ganti dengan domain Anda
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Multer Configuration
const upload = multer({ storage: multer.memoryStorage() });

// Fungsi untuk mengunggah file ke Supabase Storage
async function uploadFileToSupabase(file, filePath) {
    try {
        const { error } = await storageClient
            .from('mybucket')
            .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (error) {
            console.error('Supabase Storage Error:', error);
            return null;
        }

        return `${supabaseUrl}/storage/v1/object/public/mybucket/${filePath}`; // Kembalikan URL saja
    } catch (error) {
        console.error("Error uploading to Supabase Storage:", error);
        return null;
    }
}

// --------------------- PROJECTS CRUD ---------------------

// Create a project (with image upload)
app.post('/projects', [
    body('project_name').notEmpty().trim(),
    body('project_description').notEmpty().trim(),
    body('project_details').notEmpty().trim(),
    body('project_date').notEmpty().trim(),
], upload.single('project_image'), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log("Request body:", req.body);
        console.log("Uploaded file:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        let project_image = null;
        if (req.file) {
            const filePath = `projects/${Date.now()}${path.extname(req.file.originalname)}`;
            const imageUrl = await uploadFileToSupabase(req.file, filePath);
            if (!imageUrl) {
                return res.status(500).json({ error: 'Failed to upload image to Supabase Storage' });
            }
            project_image = imageUrl;
        }

        const { data, error } = await supabase
            .from('projects')
            .insert([{ project_name: req.body.project_name, project_image, project_description: req.body.project_description, project_details: req.body.project_details, project_date: req.body.project_date }])
            .select();

        if (error) {
            console.error("Supabase Error:", error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data); // 201 Created
    } catch (error) {
        console.error("General Error:", error);
        res.status(500).json({ error: error.message });
    }
}, (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        res.status(400).json({ error: error.message });
    } else if (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all projects
app.get('/projects', async (req, res) => {
    const { data, error } = await supabase.from('projects').select('*');

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Get a single project
app.get('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Update a project (with image upload)
app.put('/projects/:id', upload.single('project_image'), async (req, res) => {
    const { id } = req.params;
    const { project_name, project_description, project_details, project_date } = req.body;

    if (!project_name || !project_description || !project_details || !project_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    let updateData = { project_name, project_description, project_details, project_date };

    if (req.file) {
        const imageUrl = await uploadFileToSupabase(req.file, `projects/<span class="math-inline">\{Date\.now\(\)\}</span>{path.extname(req.file.originalname)}`);
        if (!imageUrl) {
            return res.status(500).json({ error: 'Failed to upload image to Supabase Storage' });
        }
        updateData.project_image = imageUrl;
    }

    const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Delete a project
app.delete('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Project deleted successfully', data });
});

// --------------------- PEOPLE CRUD ---------------------

// Create a person (with image upload)
app.post('/people', upload.single('people_image'), async (req, res, next) => {
    const { people_name, people_role, people_bio, people_contact } = req.body;

    if (!people_name || !req.file || !people_role || !people_bio || !people_contact) {
        return res.status(400).json({ error: 'All fields are required, including image upload' });
    }

    let people_image = null;
    if (req.file) {
        const imageUrl = await uploadFileToSupabase(req.file, `people/<span class="math-inline">\{Date\.now\(\)\}</span>{path.extname(req.file.originalname)}`);
        if (!imageUrl) {
            return res.status(500).json({ error: 'Failed to upload image to Supabase Storage' });
        }
        people_image = imageUrl;
    }

    const { data, error } = await supabase
        .from('people')
        .insert([{ people_name, people_image, people_role, people_bio, people_contact }])
        .select();

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
}, (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        res.status(400).json({ error: error.message });
    } else if (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all people
app.get('/people', async (req, res) => {
    const { data, error } = await supabase.from('people').select('*');

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Get a single person
app.get('/people/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('people').select('*').eq('id', id).single();

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Update a person (with image upload)
app.put('/people/:id', upload.single('people_image'), async (req, res, next) => {
    const { id } = req.params;
    const { people_name, people_role, people_bio, people_contact } = req.body;

    if (!people_name || !people_role || !people_bio || !people_contact) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    let updateData = { people_name, people_role, people_bio, people_contact };

    if (req.file) {
        const imageUrl = await uploadFileToSupabase(req.file, `people/${Date.now()}${path.extname(req.file.originalname)}`);
        if (!imageUrl) {
            return res.status(500).json({ error: 'Failed to upload image to Supabase Storage' });
        }
        updateData.people_image = imageUrl;
    }

    const { data, error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
}, (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        res.status(400).json({ error: error.message });
    } else if (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a person
app.delete('/people/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('people').delete().eq('id', id);

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Person deleted successfully', data });
});

// --------------------- ASSIGN PEOPLE TO PROJECTS ---------------------

// Assign a person to a project
app.post('/assign', async (req, res) => {
    const { project_id, people_id } = req.body;

    if (!project_id || !people_id) {
        return res.status(400).json({ error: 'Project ID and People ID are required' });
    }

    const { data, error } = await supabase.from('project_people').insert([{ project_id, people_id }]);

    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Person assigned to project successfully', data });
});

// Get people assigned to a specific project
app.get('/projects/:id/people', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('project_people')
        .select('people_id, people:people_id (people_name, people_image, people_role)')
        .eq('project_id', id);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
});

// Get projects assigned to a specific person
app.get('/people/:id/projects', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('project_people')
        .select('project_id, project:project_id (project_name, project_image)')
        .eq('people_id', id);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
});

// --------------------- START SERVER ---------------------
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;