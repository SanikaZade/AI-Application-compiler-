import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Play, Settings, CheckCircle2, AlertTriangle, XCircle, ArrowRight, 
  Database, Cpu, FileJson, Layout, Activity, TrendingUp, BarChart3, 
  HelpCircle, RefreshCw, Sparkles, ShieldAlert, Layers, ArrowLeft, 
  Code, CreditCard, Clock, Check, Users, Map, Flame, HeartHandshake,
  Compass, AlertCircle, FileCode, CheckSquare
} from 'lucide-react'

// Example Prompts from system requirements
const NORMAL_PROMPTS = [
  { id: "norm_crm", name: "CRM System", desc: "Build a CRM for sales agents to manage leads, log activities, and track deals." },
  { id: "norm_lms", name: "LMS Portal", desc: "Build an LMS where teachers create courses and students enroll & take quizzes." },
  { id: "norm_ecommerce", name: "E-commerce Store", desc: "Build an E-commerce store with product catalogs, shopping cart, and Stripe checkout." },
  { id: "norm_hospital", name: "Hospital Management", desc: "Build a hospital app for patient records, doctor prescriptions, and appointments." },
  { id: "norm_project", name: "Project Tracker", desc: "Build a Kanban board for tasks, developer assignees, and client viewers." }
]

const EDGE_PROMPTS = [
  { id: "edge_vague_1", name: "Vague Requirement", desc: "make a portal" },
  { id: "edge_conflict_1", name: "Role Conflict", desc: "Build a CRM where only admins can edit leads, but guests can also update lead statuses." },
  { id: "edge_conflict_2", name: "Checkout Conflict", desc: "Online store where guest checkout is blocked, but guests can buy without login." },
  { id: "edge_missing_info_1", name: "Missing Rules", desc: "Portal to submit leave requests, with no roles or admin approval rules defined." },
  { id: "edge_invalid_1", name: "Security Injection", desc: "sudo rm -rf /" }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, intent, architecture, schema, validation, repair, runtime, evaluation
  const [promptInput, setPromptInput] = useState('')
  
  // Pipeline data
  const [currentRun, setCurrentRun] = useState(null)
  const [compileHistory, setCompileHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)

  // Stage progress state (to simulate execution steps visually)
  const [simulatedStages, setSimulatedStages] = useState({
    intent: { status: 'idle', data: null, duration: 0 },
    architecture: { status: 'idle', data: null, duration: 0 },
    schema: { status: 'idle', data: null, duration: 0 },
    validation: { status: 'idle', data: null, duration: 0 },
    repair: { status: 'idle', data: null, duration: 0 },
    runtime: { status: 'idle', data: null, duration: 0 }
  })

  // Schema Generator Sub-Tabs
  const [activeSchemaTab, setActiveSchemaTab] = useState('ui')

  // Evaluation Framework States
  const [evaluationSuite, setEvaluationSuite] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [selectedEvalRun, setSelectedEvalRun] = useState(null)

  // Fetch compile history on load
  useEffect(() => {
    fetchHistory()
    loadLatestEvaluation()
  }, [])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await axios.get('/api/pipeline/history')
      setCompileHistory(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadLatestEvaluation = async () => {
    try {
      const res = await axios.get('/api/evaluate/latest')
      setEvaluationSuite(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  // Trigger Compilation
  const handleCompile = async (textPrompt) => {
    const targetPrompt = textPrompt || promptInput
    if (!targetPrompt.trim()) return

    setPromptInput(targetPrompt)
    setIsCompiling(true)
    setActiveTab('intent') // Move immediately to first stage

    // Set Stage 1 to loading, reset others
    setSimulatedStages({
      intent: { status: 'loading', data: null, duration: 0 },
      architecture: { status: 'idle', data: null, duration: 0 },
      schema: { status: 'idle', data: null, duration: 0 },
      validation: { status: 'idle', data: null, duration: 0 },
      repair: { status: 'idle', data: null, duration: 0 },
      runtime: { status: 'idle', data: null, duration: 0 }
    })

    try {
      const res = await axios.post('/api/pipeline/run', { prompt: targetPrompt })
      const data = res.data
      setCurrentRun(data)

      const stages = ['intent', 'architecture', 'schema', 'validation', 'repair', 'runtime']
      
      // Step-by-step progressive simulation to match compiler flow visualization
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i]
        
        // Auto navigate tabs to trace pipeline progress
        setActiveTab(stage)

        setSimulatedStages(prev => ({
          ...prev,
          [stage]: { ...prev[stage], status: 'loading' }
        }))

        // Allow visual pause for user to digest each step
        await new Promise(resolve => setTimeout(resolve, 1000))

        const stageData = data.stages[stage]
        let status = 'success'
        if (stage === 'validation') {
          status = stageData.data.valid ? 'success' : 'error'
        } else if (stage === 'repair') {
          status = stageData.data.repaired ? 'success' : 'idle'
        } else if (stage === 'runtime') {
          status = stageData.data.success ? 'success' : 'error'
        }

        setSimulatedStages(prev => ({
          ...prev,
          [stage]: {
            status: status,
            data: stageData.data,
            duration: stageData.duration_ms
          }
        }))
      }

      fetchHistory()
    } catch (e) {
      console.error(e)
      setSimulatedStages(prev => ({
        ...prev,
        intent: { status: 'error', data: { detail: e.message }, duration: 0 }
      }))
    } finally {
      setIsCompiling(false)
    }
  }

  // Load a run from past history
  const handleLoadHistory = async (runId) => {
    try {
      const res = await axios.get(`/api/pipeline/runs/${runId}`)
      const payload = res.data
      
      setCurrentRun({
        run_id: payload.run_id,
        prompt: payload.prompt,
        app_name: payload.app_name,
        domain: payload.domain,
        status: payload.status,
        metrics: payload.metrics,
        output: payload.result.repaired_schemas
      })

      // Populate stage configs directly
      setSimulatedStages({
        intent: { status: 'success', data: payload.result.intent, duration: payload.metrics.intent_ms },
        architecture: { status: 'success', data: payload.result.architecture, duration: payload.metrics.architecture_ms },
        schema: { status: 'success', data: payload.result.schemas, duration: payload.metrics.schema_ms },
        validation: { status: payload.result.validation_report.valid ? 'success' : 'error', data: payload.result.validation_report, duration: payload.metrics.validation_ms },
        repair: { status: payload.result.repair_report.repaired ? 'success' : 'idle', data: payload.result.repair_report, duration: payload.metrics.repair_ms },
        runtime: { status: payload.result.runtime_report.success ? 'success' : 'error', data: payload.result.runtime_report, duration: payload.metrics.runtime_ms }
      })

      setActiveTab('intent')
    } catch (e) {
      console.error(e)
    }
  }

  // Run Evaluation Framework
  const handleRunEvaluation = async () => {
    setEvaluating(true)
    try {
      const res = await axios.post('/api/evaluate/run')
      setEvaluationSuite(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setEvaluating(false)
    }
  }

  const renderJsonViewer = (obj) => {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>CONFIG_OUTPUT.json</span>
          <span className="text-[10px] text-slate-500">Read-Only</span>
        </div>
        <pre className="bg-[#0b0f19] p-4 text-xs font-mono text-cyan-400 overflow-x-auto max-h-[480px]">
          <code>{JSON.stringify(obj, null, 2)}</code>
        </pre>
      </div>
    )
  }

  // Sidebar link check helper
  const isStageReady = (stageKey) => {
    return simulatedStages[stageKey]?.status !== 'idle'
  }

  return (
    <div className="min-h-screen grid-bg flex text-slate-800">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-72 bg-white border-r border-compiler-slate-border flex flex-col sticky top-0 h-screen z-20">
        
        {/* Header App Brand */}
        <div className="p-6 border-b border-compiler-slate-border flex items-center gap-3">
          <div className="bg-compiler-purple p-2.5 rounded-xl shadow-glow-purple text-white">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">
              AI Application Compiler
            </h1>
            <p className="text-[10px] text-compiler-purple font-mono uppercase tracking-widest font-bold">
              Intelligent Development Platform
            </p>
          </div>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
          
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-2">
              BUILD TERMINAL
            </span>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-compiler-purple text-white shadow-glow-purple' 
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}>
              <span className="flex items-center gap-2.5">
                <Layout className="w-4.5 h-4.5" />
                App Dashboard
              </span>
              {isCompiling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            </button>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-2">
              COMPILER PIPELINE
            </span>
            <div className="space-y-1.5">
              {[
                { id: 'intent', label: '1. Intent Extraction', icon: Sparkles, badge: 'S1' },
                { id: 'architecture', label: '2. Architecture Planner', icon: Layers, badge: 'S2' },
                { id: 'schema', label: '3. Schema Generator', icon: FileCode, badge: 'S3' },
                { id: 'validation', label: '4. Validation Engine', icon: AlertCircle, badge: 'S4' },
                { id: 'repair', label: '5. Repair Engine', icon: RefreshCw, badge: 'S5' },
                { id: 'runtime', label: '6. Runtime Validation', icon: CheckSquare, badge: 'S6' },
              ].map((stage) => {
                const Icon = stage.icon
                const isReady = isStageReady(stage.id)
                const stageStatus = simulatedStages[stage.id]?.status

                return (
                  <button
                    key={stage.id}
                    disabled={!isReady}
                    onClick={() => setActiveTab(stage.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                      activeTab === stage.id
                        ? 'bg-compiler-purple/10 border border-compiler-purple/20 text-compiler-purple font-bold'
                        : isReady
                          ? 'text-slate-700 hover:bg-slate-50'
                          : 'text-slate-300 cursor-not-allowed opacity-60'
                    }`}>
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${activeTab === stage.id ? 'text-compiler-purple' : 'text-slate-400'}`} />
                      {stage.label}
                    </span>
                    
                    {stageStatus === 'loading' && <RefreshCw className="w-3 h-3 text-compiler-purple animate-spin" />}
                    {stageStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-compiler-emerald" />}
                    {stageStatus === 'error' && <XCircle className="w-3.5 h-3.5 text-compiler-rose" />}
                    {stageStatus === 'idle' && !isReady && <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">{stage.badge}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-2">
              QUALITY CONTROL
            </span>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'evaluation' 
                  ? 'bg-compiler-purple text-white shadow-glow-purple' 
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}>
              <BarChart3 className="w-4.5 h-4.5" />
              Evaluation Suite
            </button>
          </div>

        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-compiler-slate-border bg-slate-50 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center justify-between">
            <span>Compiler Mode</span>
            <span className="text-compiler-purple font-bold">Intelligent Engine</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Self-Repair</span>
            <span className="text-compiler-emerald font-bold">Active</span>
          </div>
        </div>

      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Navbar */}
        <header className="bg-white border-b border-compiler-slate-border h-16 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">WORKSPACE_ID:</span>
            <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-0.5 rounded">98d1d6fa</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-compiler-purple/5 text-compiler-purple text-[10px] font-bold rounded-full border border-compiler-purple/10">
              <span className="w-1.5 h-1.5 rounded-full bg-compiler-purple animate-ping"></span>
              Ready to compile
            </span>
          </div>
        </header>

        {/* Router Wrapper */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-8">
          
          {/* ================= 1. PAGE: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Intro card */}
              <div className="saas-card p-8 rounded-3xl relative overflow-hidden bg-gradient-to-tr from-white via-white to-compiler-purple/5 border-compiler-purple/20">
                <div className="absolute top-0 right-0 w-80 h-80 bg-compiler-purple/10 rounded-full blur-3xl -z-10"></div>
                
                <h2 className="text-2xl font-extrabold text-slate-900">Compile AI Product Specifications into Production-Ready Applications</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  AI Application Compiler transforms natural language product requirements into production-ready software applications. The system automatically extracts intent, plans architecture, generates schemas, validates requirements, repairs inconsistencies, and performs runtime verification.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <textarea
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="Describe your application requirements... (e.g. Build an LMS system where instructors can manage courses, and students pay via Stripe checkout)"
                      className="w-full min-h-[140px] p-4 text-xs font-medium saas-input rounded-2xl placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Deterministic compilation flow. 6 structural pipelines.
                    </div>
                    <button
                      onClick={() => handleCompile()}
                      disabled={isCompiling || !promptInput.trim()}
                      className="px-6 py-3 bg-compiler-purple hover:bg-compiler-purple-dark text-white font-bold rounded-xl text-xs transition-all shadow-glow-purple flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isCompiling ? 'Running Compiler...' : 'Compile Requirements'}
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Example Prompts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">
                    Standard App Blueprints
                  </h3>
                  <div className="space-y-2.5">
                    {NORMAL_PROMPTS.map((ex) => (
                      <div 
                        key={ex.id}
                        onClick={() => handleCompile(ex.desc)}
                        className="saas-card saas-card-hover p-4 rounded-2xl cursor-pointer flex items-center justify-between group">
                        <div className="pr-4">
                          <h4 className="font-bold text-slate-800 text-xs group-hover:text-compiler-purple transition-colors">{ex.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ex.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-compiler-purple transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-compiler-rose uppercase tracking-widest mb-3 pl-1 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Conflict & Drift Challenges
                  </h3>
                  <div className="space-y-2.5">
                    {EDGE_PROMPTS.map((ex) => (
                      <div 
                        key={ex.id}
                        onClick={() => handleCompile(ex.desc)}
                        className="saas-card hover:border-compiler-rose/30 p-4 rounded-2xl cursor-pointer flex items-center justify-between group hover:bg-rose-50/20">
                        <div className="pr-4">
                          <h4 className="font-bold text-slate-850 text-xs group-hover:text-compiler-rose transition-colors">{ex.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ex.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-compiler-rose transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History list */}
              <div className="saas-card p-6 rounded-3xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-compiler-purple" />
                    Compilation History Logs
                  </h3>
                  <button 
                    onClick={fetchHistory}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {historyLoading && compileHistory.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">Loading compilation history...</div>
                ) : compileHistory.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No past compile runs located.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {compileHistory.map((h) => (
                      <div 
                        key={h.run_id}
                        onClick={() => handleLoadHistory(h.run_id)}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl cursor-pointer transition-all flex items-start justify-between group">
                        <div>
                          <h4 className="text-xs font-bold text-slate-850 group-hover:text-compiler-purple transition-colors">{h.app_name}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{h.prompt}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-500 mt-2 font-mono">
                            <span className="bg-white border border-slate-200 px-1 rounded">{h.domain.toUpperCase()}</span>
                            <span>{new Date(h.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          h.status === 'vague_input' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                        }`}>
                          {h.status === 'vague_input' ? 'VAGUE' : 'COMPILED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= 2. PAGE: INTENT EXTRACTION ================= */}
          {activeTab === 'intent' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    STAGE 1: PARSER
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Intent Extraction IR</h2>
                  <p className="text-xs text-slate-400 mt-1">Converts raw prompt conditions into a structured Intermediate Representation (IR).</p>
                </div>
              </div>

              {simulatedStages.intent.status === 'loading' ? (
                <div className="saas-card p-12 text-center text-slate-400 text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <p className="font-mono">Extracting semantic variables...</p>
                </div>
              ) : simulatedStages.intent.data ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: UI cards of items */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* App Identity */}
                    <div className="saas-card p-5 rounded-2xl space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Inferred Domain</span>
                      <h3 className="font-bold text-slate-800 text-base">{simulatedStages.intent.data.app_name}</h3>
                      <p className="text-[10px] font-mono text-compiler-purple font-semibold uppercase">{simulatedStages.intent.data.extracted_domain}</p>
                    </div>

                    {/* Roles */}
                    <div className="saas-card p-5 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Identified User Roles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {simulatedStages.intent.data.roles.map((r, idx) => (
                          <span key={idx} className="bg-compiler-purple/5 text-compiler-purple text-[10px] px-2.5 py-0.5 rounded-lg border border-compiler-purple/10 font-medium">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Entities */}
                    <div className="saas-card p-5 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block flex items-center gap-1">
                        <Database className="w-3.5 h-3.5" /> Extracted Entities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {simulatedStages.intent.data.entities.map((e, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-0.5 rounded-lg border border-slate-200 font-medium">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Conflicts & Assumptions */}
                    {simulatedStages.intent.data.conflicts.length > 0 && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1.5">
                        <h4 className="font-bold flex items-center gap-1"><Flame className="w-4 h-4" /> System Conflicted requirements Resolved:</h4>
                        <p className="font-mono text-[10px]">{simulatedStages.intent.data.conflicts[0].detail}</p>
                        <p className="text-[10px] font-bold">Resolution: {simulatedStages.intent.data.conflicts[0].resolution}</p>
                      </div>
                    )}

                    {simulatedStages.intent.data.assumptions.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                        <h4 className="font-bold flex items-center gap-1"><HeartHandshake className="w-4 h-4" /> Compiled Assumptions:</h4>
                        <ul className="list-disc pl-4 space-y-0.5 text-[10px] leading-relaxed">
                          {simulatedStages.intent.data.assumptions.map((ass, i) => (
                            <li key={i}>{ass}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                  {/* Right Column: Code viewer */}
                  <div className="lg:col-span-3">
                    {renderJsonViewer(simulatedStages.intent.data)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Please compile a prompt on the Dashboard page to load intent details.</div>
              )}
            </div>
          )}

          {/* ================= 3. PAGE: ARCHITECTURE PLANNER ================= */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    STAGE 2: SYSTEM DESIGN
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Architecture Planner Specs</h2>
                  <p className="text-xs text-slate-400 mt-1">Generates access matrix mappings, navigation structures, and user workflow diagrams.</p>
                </div>
              </div>

              {simulatedStages.architecture.status === 'loading' ? (
                <div className="saas-card p-12 text-center text-slate-400 text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <p className="font-mono">Drafting topology maps...</p>
                </div>
              ) : simulatedStages.architecture.data ? (
                <div className="space-y-6">
                  
                  {/* Flow Diagrams */}
                  <div className="saas-card p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-compiler-purple" /> Dynamic Workspace Architecture Flow Map
                    </h3>

                    {/* SVG Flow diagram */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 overflow-x-auto flex justify-center">
                      <div className="flex items-center gap-6 min-w-[600px] py-4">
                        
                        {/* Box 1: Roles */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider text-center">User Roles</span>
                          {Object.keys(simulatedStages.architecture.data.permissions).map((role, idx) => (
                            <div key={idx} className="bg-white border border-compiler-purple/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-compiler-purple text-center shadow-sm">
                              {role}
                            </div>
                          ))}
                        </div>

                        {/* Arrow SVG 1 */}
                        <svg className="w-12 h-8 text-slate-350" viewBox="0 0 50 20" fill="none">
                          <path d="M0 10 H40 M35 5 L45 10 L35 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>

                        {/* Box 2: Pages / Router */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider text-center">Navigation Routes</span>
                          {simulatedStages.architecture.data.navigation.slice(0, 3).map((nav, idx) => (
                            <div key={idx} className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-600 text-center shadow-sm">
                              {nav.path}
                            </div>
                          ))}
                          {simulatedStages.architecture.data.navigation.length > 3 && (
                            <div className="text-[9px] text-slate-400 text-center">+ {simulatedStages.architecture.data.navigation.length - 3} more routes</div>
                          )}
                        </div>

                        {/* Arrow SVG 2 */}
                        <svg className="w-12 h-8 text-slate-350" viewBox="0 0 50 20" fill="none">
                          <path d="M0 10 H40 M35 5 L45 10 L35 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>

                        {/* Box 3: Entities / DB Tables */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider text-center">Entities</span>
                          {Object.keys(simulatedStages.architecture.data.permissions[Object.keys(simulatedStages.architecture.data.permissions)[0]]).map((ent, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold text-cyan-400 text-center shadow-sm font-mono">
                              {ent}
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Navigation Map list */}
                    <div className="saas-card p-6 rounded-3xl space-y-4">
                      <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                        <Map className="w-4 h-4 text-compiler-purple" /> Navigation Map
                      </h3>
                      <div className="divide-y divide-slate-100">
                        {simulatedStages.architecture.data.navigation.map((nav, idx) => (
                          <div key={idx} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{nav.name}</span>
                              <span className="font-mono text-slate-400 text-[10px] block mt-0.5">{nav.path}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                              {nav.roles.map((r, i) => (
                                <span key={i} className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Permissions Roles matrix table */}
                    <div className="saas-card p-6 rounded-3xl space-y-4">
                      <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-compiler-purple" /> Permissions & Access Control Matrix
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="pb-2">Role</th>
                              <th className="pb-2">Entity</th>
                              <th className="pb-2">CRUD Rights</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {Object.entries(simulatedStages.architecture.data.permissions).map(([role, entitiesMap]) => 
                              Object.entries(entitiesMap).map(([entity, crudArray], subIdx) => (
                                <tr key={`${role}-${entity}`} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 font-bold text-slate-700">{subIdx === 0 ? role : ''}</td>
                                  <td className="py-2.5 font-mono text-slate-500">{entity}</td>
                                  <td className="py-2.5">
                                    <div className="flex gap-1">
                                      {crudArray.length === 0 ? (
                                        <span className="text-[8px] font-bold bg-slate-100 text-slate-400 px-1 py-0.5 rounded">DENIED</span>
                                      ) : (
                                        crudArray.map((op, i) => (
                                          <span key={i} className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded border border-emerald-250">
                                            {op.toUpperCase()}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Please compile a prompt on the Dashboard page to load architecture details.</div>
              )}
            </div>
          )}

          {/* ================= 4. PAGE: SCHEMA GENERATOR ================= */}
          {activeTab === 'schema' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    STAGE 3: CODE GEN
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Schema Generator Specs</h2>
                  <p className="text-xs text-slate-400 mt-1">Generates coordinated schemas spanning interfaces, APIs, tables, and middleware security.</p>
                </div>
              </div>

              {simulatedStages.schema.status === 'loading' ? (
                <div className="saas-card p-12 text-center text-slate-400 text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <p className="font-mono">Constructing schema blueprints...</p>
                </div>
              ) : currentRun?.output ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* Left Column: Schema tabs selector */}
                  <div className="lg:col-span-1 space-y-2">
                    {[
                      { id: 'ui', label: 'UI Schema', desc: 'Forms, elements and layout configuration' },
                      { id: 'api', label: 'API Schema', desc: 'Endpoints, methods, payload parameters' },
                      { id: 'db', label: 'Database Schema', desc: 'SQLite tables, keys, column constraints' },
                      { id: 'auth', label: 'Authentication Schema', desc: 'Token rules, middleware bypass definitions' },
                      { id: 'payments', label: 'Business Logic / Stripe', desc: 'Stripe product configuration details' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSchemaTab(tab.id)}
                        className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                          activeSchemaTab === tab.id
                            ? 'bg-compiler-purple/5 border-compiler-purple/25 text-compiler-purple'
                            : 'bg-white border-compiler-slate-border text-slate-600 hover:bg-slate-50'
                        }`}>
                        <div className="text-xs font-bold">{tab.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{tab.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Code block display */}
                  <div className="lg:col-span-3">
                    {renderJsonViewer(currentRun.output[activeSchemaTab])}
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Please compile a prompt on the Dashboard page to load schema details.</div>
              )}
            </div>
          )}

          {/* ================= 5. PAGE: VALIDATION ENGINE ================= */}
          {activeTab === 'validation' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    STAGE 4: LINT & CHECK
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Validation Engine Report</h2>
                  <p className="text-xs text-slate-400 mt-1">Performs semantic validation, checking required properties, types, and cross-layer reference drifts.</p>
                </div>
              </div>

              {simulatedStages.validation.status === 'loading' ? (
                <div className="saas-card p-12 text-center text-slate-400 text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <p className="font-mono">Evaluating cross-layer constraints...</p>
                </div>
              ) : simulatedStages.validation.data ? (
                <div className="space-y-6">
                  
                  {/* Validation status overview banner */}
                  <div className={`p-6 rounded-3xl border flex items-center gap-4 ${
                    simulatedStages.validation.data.valid 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {simulatedStages.validation.data.valid ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm">
                        {simulatedStages.validation.data.valid 
                          ? 'Validation Successful: Ready for deploy' 
                          : `Validation Failed: Detected ${simulatedStages.validation.data.errors.length} Schema Drift Errors`
                        }
                      </h3>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {simulatedStages.validation.data.valid 
                          ? 'All properties, types, and references across UI, API, DB and Auth schemas match perfectly.' 
                          : 'Validation Engine identified mismatches between form components and expected endpoint models. Diverting to Stage 5 Repair.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Errors & Warnings layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Error list */}
                    <div className="saas-card p-6 rounded-3xl space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-compiler-rose" /> Error Reports ({simulatedStages.validation.data.errors.length})
                      </h3>

                      {simulatedStages.validation.data.errors.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">No critical validation errors identified.</div>
                      ) : (
                        <div className="space-y-3">
                          {simulatedStages.validation.data.errors.map((err, idx) => (
                            <div key={idx} className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-rose-700">
                                <span>{err.error_type}</span>
                                <span className="bg-rose-100 text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold">{err.layer}</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">{err.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warnings list */}
                    <div className="saas-card p-6 rounded-3xl space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-compiler-amber" /> System Warnings ({simulatedStages.validation.data.warnings.length})
                      </h3>

                      {simulatedStages.validation.data.warnings.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">No warning discrepancies located.</div>
                      ) : (
                        <div className="space-y-3">
                          {simulatedStages.validation.data.warnings.map((warn, idx) => (
                            <div key={idx} className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-amber-700">
                                <span>{warn.warning_type}</span>
                                <span className="bg-amber-100 text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold">{warn.layer}</span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">{warn.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Please compile a prompt on the Dashboard page to load validation details.</div>
              )}
            </div>
          )}

          {/* ================= 6. PAGE: REPAIR ENGINE ================= */}
          {activeTab === 'repair' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    STAGE 5: AUTO-REPAIR
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Self-Repair Engine Details</h2>
                  <p className="text-xs text-slate-400 mt-1">Surgically resolves validation faults and drift mismatches without needing a full-flow retry.</p>
                </div>
              </div>

              {simulatedStages.repair.status === 'loading' ? (
                <div className="saas-card p-12 text-center text-slate-400 text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <p className="font-mono">Applying surgical alignments...</p>
                </div>
              ) : simulatedStages.repair.data ? (
                <div className="space-y-6">
                  
                  {/* Before / After layout */}
                  {simulatedStages.repair.data.repairs.length > 0 ? (
                    <div className="space-y-6">
                      {simulatedStages.repair.data.repairs.map((rep, idx) => (
                        <div key={idx} className="saas-card rounded-3xl overflow-hidden border border-slate-200 bg-white">
                          
                          {/* Log description */}
                          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-[8px] bg-compiler-purple/10 text-compiler-purple font-bold px-2 py-0.5 rounded border border-compiler-purple/20 font-mono uppercase">
                                Action Log #{idx + 1}
                              </span>
                              <h3 className="font-bold text-slate-800 text-xs mt-1.5">{rep.error_detected}</h3>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Applied Fix: {rep.repair_applied}</p>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              REPAIRED
                            </span>
                          </div>

                          {/* Split diff viewer */}
                          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-150 font-mono text-[11px]">
                            
                            {/* Before */}
                            <div className="p-5 space-y-2 bg-rose-50/20">
                              <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold block">Pre-Repair Code State</span>
                              <pre className="p-3 bg-[#1d080c] text-rose-400 rounded-xl border border-rose-100/50 overflow-x-auto">
                                <code>{rep.before}</code>
                              </pre>
                            </div>

                            {/* After */}
                            <div className="p-5 space-y-2 bg-emerald-50/20">
                              <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold block">Post-Repair Compiled State</span>
                              <pre className="p-3 bg-[#081d11] text-emerald-400 rounded-xl border border-emerald-100/50 overflow-x-auto">
                                <code>{rep.after}</code>
                              </pre>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="saas-card p-12 text-center text-slate-500 text-xs space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-compiler-emerald mx-auto" />
                      <p className="font-bold">No Code Repair Interventions Necessary</p>
                      <p className="text-[10px] text-slate-400">Schemas compiled clean directly in stage 3, bypassing self-repair.</p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Please compile a prompt on the Dashboard page to load repair details.</div>
              )}
            </div>
          )}

          {/* ================= 7. PAGE: RUNTIME VALIDATION ================= */}
          {activeTab === 'runtime' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    STAGE 6: EXECUTION CHECK
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Runtime Validation Report</h2>
                  <p className="text-xs text-slate-400 mt-1">Simulates compilation in a sandbox to ensure database schemas and api routes map securely.</p>
                </div>
              </div>

              {simulatedStages.runtime.status === 'loading' ? (
                <div className="saas-card p-12 text-center text-slate-400 text-xs space-y-3">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <p className="font-mono">Compiling sandbox environment...</p>
                </div>
              ) : simulatedStages.runtime.data ? (
                <div className="space-y-6">
                  
                  {/* Pass Indicators Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {simulatedStages.runtime.data.results.map((res, idx) => (
                      <div key={idx} className="saas-card p-5 rounded-2xl flex items-start justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono block uppercase">{res.component}</span>
                          <h4 className="text-xs font-bold text-slate-800 mt-1.5 leading-snug">{res.message}</h4>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                          res.status === 'PASS' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Runtime manifest JSON */}
                  <div className="saas-card p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      <FileJson className="w-4 h-4 text-compiler-purple" /> Final Executed Compiler Manifest
                    </h3>
                    {renderJsonViewer(simulatedStages.runtime.data.manifest)}
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">Please compile a prompt on the Dashboard page to load runtime verification details.</div>
              )}
            </div>
          )}

          {/* ================= 8. PAGE: SYSTEM EVALUATION ================= */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] bg-compiler-purple/10 text-compiler-purple font-bold px-2.5 py-1 rounded-full border border-compiler-purple/20">
                    BENCHMARKS
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">Evaluation Framework</h2>
                  <p className="text-xs text-slate-400 mt-1">Executes 20 standard and edge challenge prompts parallelly to stress-test the validation repair loop.</p>
                </div>

                <button
                  onClick={handleRunEvaluation}
                  disabled={evaluating}
                  className="px-5 py-2.5 bg-compiler-purple hover:bg-compiler-purple-dark text-white font-bold rounded-xl text-xs transition-all shadow-glow-purple disabled:opacity-50 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {evaluating ? 'Running suite...' : 'Execute Suite'}
                </button>
              </div>

              {/* Summary KPIs */}
              {evaluationSuite && (
                <div className="space-y-6">
                  
                  {/* Dashboard metrics cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    
                    <div className="saas-card p-5 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Compiler Success Rate</span>
                      <h3 className="text-2xl font-extrabold text-compiler-purple mt-1.5 glow-text-purple">
                        {evaluationSuite.summary.success_rate.toFixed(0)}%
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {evaluationSuite.summary.success_count} / {evaluationSuite.summary.total_runs} Compiled OK
                      </p>
                    </div>

                    <div className="saas-card p-5 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Failure Rate</span>
                      <h3 className="text-2xl font-extrabold text-compiler-rose mt-1.5">
                        {evaluationSuite.summary.failure_count > 0 ? (evaluationSuite.summary.failure_count / evaluationSuite.summary.total_runs * 100).toFixed(0) : 0}%
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Due to vague prompts</p>
                    </div>

                    <div className="saas-card p-5 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Drift Errors Caught</span>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">
                        {evaluationSuite.summary.total_validation_errors}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Cross-schema mismatches</p>
                    </div>

                    <div className="saas-card p-5 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Repairs Executed</span>
                      <h3 className="text-2xl font-extrabold text-compiler-emerald mt-1.5">
                        {evaluationSuite.summary.total_repairs_applied}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Self-repair alignments</p>
                    </div>

                    <div className="saas-card p-5 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Avg Compile Duration</span>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5 font-mono">
                        {evaluationSuite.summary.avg_generation_time_ms.toFixed(1)} ms
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Across 6-stage runs</p>
                    </div>

                  </div>

                  {/* Benchmark runs table list */}
                  <div className="saas-card p-6 rounded-3xl space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <BarChart3 className="w-4.5 h-4.5 text-compiler-purple" /> Dynamic Prompt Compilation Matrix
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-3 pl-2">App Target</th>
                            <th className="pb-3">Dataset Tier</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Drifts Fixed</th>
                            <th className="pb-3">Latency</th>
                            <th className="pb-3 text-right pr-2">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evaluationSuite.runs.map((run, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 pl-2 font-bold text-slate-700">{run.name}</td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                                  run.type === 'normal' 
                                    ? 'bg-slate-100 border-slate-200 text-slate-500' 
                                    : 'bg-rose-50 border-rose-200 text-rose-600'
                                }`}>
                                  {run.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  run.success 
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-amber-100 text-amber-700 border border-amber-250'
                                }`}>
                                  {run.success ? 'COMPILED' : 'VAGUE/RESOLVED'}
                                </span>
                              </td>
                              <td className="py-3.5 font-mono text-slate-500">{run.repairs_count}</td>
                              <td className="py-3.5 font-mono text-slate-500">{run.duration_ms.toFixed(1)}ms</td>
                              <td className="py-3.5 text-right pr-2">
                                <button 
                                  onClick={() => setSelectedEvalRun(run)}
                                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-compiler-purple rounded text-[10px] transition-colors font-semibold">
                                  Inspect Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Modal details */}
                  {selectedEvalRun && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white max-w-lg w-full rounded-3xl p-6 space-y-4 border border-slate-200 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{selectedEvalRun.name}</h3>
                            <span className="text-[9px] text-slate-400 font-mono">TEST_CASE_UUID: {selectedEvalRun.id}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedEvalRun(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-50 p-1 rounded-full w-6 h-6 flex items-center justify-center">
                            ✕
                          </button>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-650">
                          <div>
                            <span className="text-slate-400 block font-medium">Input prompt:</span>
                            <p className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 italic">"{selectedEvalRun.prompt}"</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-slate-400 block uppercase font-mono">Compile time</span>
                              <span className="text-slate-800 font-bold font-mono text-sm block mt-1">{selectedEvalRun.duration_ms.toFixed(1)} ms</span>
                            </div>
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-slate-400 block uppercase font-mono">Validation Warnings</span>
                              <span className="text-slate-800 font-bold font-mono text-sm block mt-1">{selectedEvalRun.warnings_count}</span>
                            </div>
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-slate-400 block uppercase font-mono">Repairs applied</span>
                              <span className="text-slate-800 font-bold font-mono text-sm block mt-1">{selectedEvalRun.repairs_count}</span>
                            </div>
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-slate-400 block uppercase font-mono">Outcome code</span>
                              <span className="text-slate-800 font-bold font-mono text-sm block mt-1">{selectedEvalRun.success ? 'PASS' : 'VAGUE'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {!evaluationSuite && !evaluating && (
                <div className="saas-card p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
                  <BarChart3 className="w-12 h-12 text-compiler-purple mx-auto animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-800">Execute Suite Benchmarks</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trigger the benchmark suite to run the complete 20 stress-test prompts (10 standard templates and 10 edge cases) and measure metrics like compilation success, failure rates, repair count, and latencies.
                  </p>
                  <button
                    onClick={handleRunEvaluation}
                    className="px-6 py-3 bg-compiler-purple hover:bg-compiler-purple-dark text-white font-bold rounded-xl text-xs transition-all shadow-glow-purple flex items-center gap-2 mx-auto">
                    Launch Suite Runner <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {evaluating && (
                <div className="saas-card p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
                  <RefreshCw className="w-8 h-8 text-compiler-purple animate-spin mx-auto" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Evaluating compiler engine...</h3>
                  <p className="text-[10px] text-slate-400 font-mono animate-pulse">Running LMS, CRM, ecommerce checks and vague/conflict injections...</p>
                </div>
              )}
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-compiler-slate-border py-4 px-8 flex items-center justify-between text-[10px] text-slate-400 mt-auto font-mono">
          <span>© 2026 AI Application Compiler. All rights reserved.</span>
          <span>Target Platform: FastAPI + SQLite3</span>
        </footer>
      </div>

    </div>
  )
}
