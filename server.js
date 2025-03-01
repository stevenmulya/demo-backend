require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const storage = supabase.storage;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Multer Configuration
const upload = multer({ storage: multer.memoryStorage() });

// Fungsi untuk mengunggah file ke Supabase Storage
async function uploadFileToSupabase(file, filePath) {
    try {
        const { error, data } = await storage
            .from('projects')
            .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (error) {
            console.error('Supabase Storage Error:', error);
            return null;
        }

        return `${supabaseUrl}/storage/v1/object/public/projects/${filePath}`;
    } catch (error) {
        console.error("Error uploading to Supabase Storage:", error);
        return null;
    }
}

// --------------------- PROJECTS CRUD ---------------------

// Create a project (with image upload)
app.post('/projects', upload.single('project_image'), async (req, res) => {
    try {
        const { project_name, project_description, project_details, project_date } = req.body;

        let project_image = null;
        if (req.file) {
            const filePath = `${Date.now()}${path.extname(req.file.originalname)}`;
            project_image = await uploadFileToSupabase(req.file, filePath);
            if (!project_image) {
                return res.status(500).json({ error: 'Failed to upload image' });
            }
        }

        const { data, error } = await supabase
            .from('projects')
            .insert([{ project_name, project_image, project_description, project_details, project_date }])
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all projects
app.get('/projects', async (req, res) => {
    const { data, error } = await supabase.from('projects').select('*');

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Get a single project
app.get('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});

// Update a project (with image upload)
app.put('/projects/:id', upload.single('project_image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { project_name, project_description, project_details, project_date } = req.body;

        let updateData = { project_name, project_description, project_details, project_date };

        if (req.file) {
            const filePath = `${Date.now()}${path.extname(req.file.originalname)}`;
            const project_image = await uploadFileToSupabase(req.file, filePath);
            if (!project_image) {
                return res.status(500).json({ error: 'Failed to upload image' });
            }
            updateData.project_image = project_image;
        }

        const { data, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a project
app.delete('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Project deleted', data });
});

// --------------------- START SERVER ---------------------
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});