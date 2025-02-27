require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

// Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(cors({ origin: '*' })); // Konfigurasi CORS yang lebih aman
app.use(express.json());

// --------------------- PROJECTS CRUD ---------------------

// Create a project
app.post('/projects', async (req, res) => {
    const { project_name, project_image, project_description, project_details, project_date } = req.body;

    // Validasi input
    if (!project_name || !project_image || !project_description || !project_details || !project_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase
        .from('projects')
        .insert([{ project_name, project_image, project_description, project_details, project_date }])
        .select();
    
    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
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

// Update a project
app.put('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { project_name, project_image, project_description, project_details, project_date } = req.body;

    if (!project_name || !project_image || !project_description || !project_details || !project_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase
        .from('projects')
        .update({ project_name, project_image, project_description, project_details, project_date })
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

// Create a person
app.post('/people', async (req, res) => {
    const { people_name, people_image, people_role, people_bio, people_contact } = req.body;

    if (!people_name || !people_image || !people_role || !people_bio || !people_contact) {
        return res.status(400).json({ error: 'All fields are required' });
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

// Update a person
app.put('/people/:id', async (req, res) => {
    const { id } = req.params;
    const { people_name, people_image, people_role, people_bio, people_contact } = req.body;

    if (!people_name || !people_image || !people_role || !people_bio || !people_contact) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase
        .from('people')
        .update({ people_name, people_image, people_role, people_bio, people_contact })
        .eq('id', id)
        .select();
    
    if (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
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
