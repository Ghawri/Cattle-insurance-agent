import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
};

// Verify auth token
const verifyAuth = async (authHeader: string | null) => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
};

// Initialize storage bucket
const initializeBucket = async () => {
  const supabase = getSupabaseClient();
  const bucketName = 'make-907e83b0-cattle-files';
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log(`Created bucket: ${bucketName}`);
  }
};

// Initialize demo agent
const initializeDemoAgent = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Check if user already exists by trying to get their info
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const demoUserExists = existingUsers?.users?.some(
      user => user.email === 'agent1@cattle-insurance.app'
    );
    
    if (!demoUserExists) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'agent1@cattle-insurance.app',
        password: 'demo123',
        user_metadata: { 
          username: 'agent1', 
          name: 'Demo Agent', 
          phone: '+91 9876543210', 
          agentCode: 'AG001',
          role: 'agent' 
        },
        email_confirm: true,
      });
      
      if (error) {
        console.log('Demo agent creation error:', error);
      } else {
        console.log('Demo agent created successfully');
      }
    } else {
      console.log('Demo agent already exists');
    }
  } catch (error) {
    console.log('Demo agent initialization error:', error);
  }
};

// Call initialization on startup
await initializeBucket();
await initializeDemoAgent();

// Health check endpoint
app.get("/make-server-907e83b0/health", (c) => {
  return c.json({ status: "ok" });
});

// Agent signup
app.post("/make-server-907e83b0/agent/signup", async (c) => {
  try {
    const { username, password, name, phone, agentCode } = await c.req.json();
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username}@cattle-insurance.app`,
      password: password,
      user_metadata: { username, name, phone, agentCode, role: 'agent' },
      email_confirm: true, // Auto-confirm since no email server configured
    });
    
    if (error) {
      console.log(`Agent signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true, userId: data.user.id });
  } catch (error) {
    console.log(`Agent signup exception: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Agent login
app.post("/make-server-907e83b0/agent/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@cattle-insurance.app`,
      password: password,
    });
    
    if (error) {
      console.log(`Agent login error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ 
      success: true, 
      accessToken: data.session.access_token,
      agent: data.user.user_metadata
    });
  } catch (error) {
    console.log(`Agent login exception: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Get agent profile
app.get("/make-server-907e83b0/agent/profile", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({ agent: user.user_metadata });
});

// Create farmer
app.post("/make-server-907e83b0/farmer/create", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const farmerData = await c.req.json();
    const farmerId = crypto.randomUUID();
    
    await kv.set(`farmer:${farmerId}`, {
      ...farmerData,
      id: farmerId,
      agentId: user.id,
      createdAt: new Date().toISOString(),
    });
    
    // Add to agent's farmer list
    const agentFarmers = await kv.get(`agent:${user.id}:farmers`) || [];
    agentFarmers.push(farmerId);
    await kv.set(`agent:${user.id}:farmers`, agentFarmers);
    
    return c.json({ success: true, farmerId });
  } catch (error) {
    console.log(`Create farmer error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Get agent's farmers
app.get("/make-server-907e83b0/agent/farmers", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const farmerIds = await kv.get(`agent:${user.id}:farmers`) || [];
    const farmers = await kv.mget(farmerIds.map((id: string) => `farmer:${id}`));
    
    return c.json({ farmers });
  } catch (error) {
    console.log(`Get farmers error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Create policy
app.post("/make-server-907e83b0/policy/create", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const policyData = await c.req.json();
    const policyId = crypto.randomUUID();
    
    const policy = {
      ...policyData,
      id: policyId,
      agentId: user.id,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    await kv.set(`policy:${policyId}`, policy);
    
    // Add to farmer's policies
    const farmerPolicies = await kv.get(`farmer:${policyData.farmerId}:policies`) || [];
    farmerPolicies.push(policyId);
    await kv.set(`farmer:${policyData.farmerId}:policies`, farmerPolicies);
    
    // Add to agent's policies
    const agentPolicies = await kv.get(`agent:${user.id}:policies`) || [];
    agentPolicies.push(policyId);
    await kv.set(`agent:${user.id}:policies`, agentPolicies);
    
    return c.json({ success: true, policyId, policy });
  } catch (error) {
    console.log(`Create policy error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Get upcoming renewals
app.get("/make-server-907e83b0/agent/renewals", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const policyIds = await kv.get(`agent:${user.id}:policies`) || [];
    const policies = await kv.mget(policyIds.map((id: string) => `policy:${id}`));
    
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    
    const upcomingRenewals = policies.filter((policy: any) => {
      if (!policy || policy.status !== 'active') return false;
      const renewalDate = new Date(policy.nextRenewalDate).getTime();
      return renewalDate <= thirtyDaysFromNow && renewalDate >= now;
    });
    
    // Get farmer details for each renewal
    const renewalsWithFarmers = await Promise.all(
      upcomingRenewals.map(async (policy: any) => {
        const farmer = await kv.get(`farmer:${policy.farmerId}`);
        return { ...policy, farmer };
      })
    );
    
    return c.json({ renewals: renewalsWithFarmers });
  } catch (error) {
    console.log(`Get renewals error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Create claim
app.post("/make-server-907e83b0/claim/create", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const claimData = await c.req.json();
    const claimId = crypto.randomUUID();
    
    const claim = {
      ...claimData,
      id: claimId,
      agentId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`claim:${claimId}`, claim);
    
    // Add to policy's claims
    const policyClaims = await kv.get(`policy:${claimData.policyId}:claims`) || [];
    policyClaims.push(claimId);
    await kv.set(`policy:${claimData.policyId}:claims`, policyClaims);
    
    return c.json({ success: true, claimId, claim });
  } catch (error) {
    console.log(`Create claim error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// ML verification for claim
app.post("/make-server-907e83b0/claim/verify", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { claimId } = await c.req.json();
    const claim = await kv.get(`claim:${claimId}`);
    
    if (!claim) {
      return c.json({ error: 'Claim not found' }, 404);
    }
    
    // Mock ML verification - in production, this would call actual ML models
    const mlScore = Math.random();
    
    let verification = {
      isDeceased: mlScore > 0.3,
      confidence: mlScore,
      cattleMatch: mlScore > 0.4,
      suspiciousIndicators: [] as string[],
      suggestedAction: 'approve',
      causeOfDeath: 'natural',
    };
    
    // Add suspicious indicators based on mock analysis
    if (mlScore < 0.5) {
      verification.suspiciousIndicators.push('Low confidence in cattle identity match');
    }
    if (mlScore < 0.4) {
      verification.suspiciousIndicators.push('Possible signs of life detected');
      verification.suggestedAction = 'investigation_required';
    }
    if (mlScore < 0.6 && mlScore >= 0.4) {
      verification.suggestedAction = 'manual_review';
    }
    
    // Update claim with verification
    claim.mlVerification = verification;
    claim.status = verification.suggestedAction === 'approve' ? 'approved' : 'under_review';
    await kv.set(`claim:${claimId}`, claim);
    
    return c.json({ success: true, verification });
  } catch (error) {
    console.log(`Claim verification error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Generate farmer upload link
app.post("/make-server-907e83b0/claim/generate-link", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { claimId, farmerId } = await c.req.json();
    const uploadToken = crypto.randomUUID();
    
    await kv.set(`upload:${uploadToken}`, {
      claimId,
      farmerId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
    
    const uploadUrl = `/farmer-upload?token=${uploadToken}`;
    
    return c.json({ success: true, uploadToken, uploadUrl });
  } catch (error) {
    console.log(`Generate link error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Verify upload token (no auth required - for farmers)
app.get("/make-server-907e83b0/upload/verify/:token", async (c) => {
  try {
    const token = c.req.param('token');
    const uploadData = await kv.get(`upload:${token}`);
    
    if (!uploadData) {
      return c.json({ error: 'Invalid or expired link' }, 404);
    }
    
    const expiresAt = new Date(uploadData.expiresAt).getTime();
    if (Date.now() > expiresAt) {
      return c.json({ error: 'Link has expired' }, 400);
    }
    
    return c.json({ valid: true, claimId: uploadData.claimId });
  } catch (error) {
    console.log(`Verify upload token error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Upload file
app.post("/make-server-907e83b0/upload/file", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const token = formData.get('token') as string;
    const fileType = formData.get('fileType') as string; // 'image' or 'video'
    
    if (!file || !token) {
      return c.json({ error: 'Missing file or token' }, 400);
    }
    
    const uploadData = await kv.get(`upload:${token}`);
    if (!uploadData) {
      return c.json({ error: 'Invalid token' }, 404);
    }
    
    const supabase = getSupabaseClient();
    const fileName = `${uploadData.claimId}/${fileType}_${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('make-907e83b0-cattle-files')
      .upload(fileName, await file.arrayBuffer(), {
        contentType: file.type,
      });
    
    if (error) {
      console.log(`File upload error: ${error.message}`);
      return c.json({ error: error.message }, 500);
    }
    
    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('make-907e83b0-cattle-files')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year
    
    // Store file reference in claim
    const claim = await kv.get(`claim:${uploadData.claimId}`);
    if (claim) {
      if (!claim.uploadedFiles) {
        claim.uploadedFiles = [];
      }
      claim.uploadedFiles.push({
        fileName,
        fileType,
        uploadedAt: new Date().toISOString(),
        signedUrl: signedUrlData?.signedUrl,
      });
      await kv.set(`claim:${uploadData.claimId}`, claim);
    }
    
    return c.json({ 
      success: true, 
      fileName,
      signedUrl: signedUrlData?.signedUrl 
    });
  } catch (error) {
    console.log(`Upload file exception: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Get agent statistics
app.get("/make-server-907e83b0/agent/stats", async (c) => {
  const user = await verifyAuth(c.req.header('Authorization'));
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const farmerIds = await kv.get(`agent:${user.id}:farmers`) || [];
    const policyIds = await kv.get(`agent:${user.id}:policies`) || [];
    const policies = await kv.mget(policyIds.map((id: string) => `policy:${id}`));
    
    const activePolicies = policies.filter((p: any) => p && p.status === 'active').length;
    
    return c.json({
      totalFarmers: farmerIds.length,
      totalPolicies: policyIds.length,
      activePolicies,
    });
  } catch (error) {
    console.log(`Get stats error: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);