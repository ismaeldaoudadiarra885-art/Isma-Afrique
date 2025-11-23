 export type Language = 'fr' | 'en' | 'bm' | 'ff' | 'snk' | 'dgo';

export type Locale = {
  [key: string]: string;
};

export const locales: { [key in Language]: Locale } = {
  fr: {
    // Welcome Screen
    welcomeSubtitle: "Votre assistant intelligent pour la conception et la gestion de formulaires KoboToolbox.",
    welcomeCreateAITitle: "Créer avec l'IA",
    welcomeCreateAIDesc: "Décrivez votre projet et laissez l'IA générer une première version de votre formulaire.",
    welcomeImportTitle: "Importer un formulaire",
    welcomeImportDesc: "Importez un formulaire existant depuis un fichier Word (.docx) pour le structurer avec l'IA.",
    welcomeImportSovereignTitle: "Importer un projet ISMA",
    welcomeImportSovereignDesc: "Chargez un projet complet sauvegardé depuis ISMA au format .json.",
    welcomeDemoTitle: "Explorer la Démo",
    welcomeDemoDesc: "Découvrez les fonctionnalités de l'application avec un projet d'exemple pré-chargé.",
    
    // Notifications
    notificationImporting: "Importation du projet en cours...",
    notificationImportSuccess: "Projet importé avec succès !",
    notificationSovereignImportSuccess: "Projet ISMA importé avec succès !",
    notificationSovereignImportError: "Erreur lors de l'import du fichier JSON. Est-il valide ?",
    notificationImportError: "Erreur lors de l'importation",
    notification_aiGenerationStart: "Génération du formulaire par l'IA en cours...",
    notification_aiGenerationSuccess: "Formulaire généré avec succès !",
    notification_sync_started: "Synchronisation démarrée...",
    notification_sync_success: "Synchronisation terminée avec succès !",
    notification_sync_error: "Échec de la synchronisation.",
    confirmSaveChanges: "Êtes-vous sûr de vouloir sauvegarder les modifications ?",
    notification_questionSaved: "Question '{{questionName}}' sauvegardée avec succès.",

    // AI Generation Modal
    aiGenerationModal_title: "Créer un Projet avec l'IA",
    aiGenerationModal_description: "Décrivez le but de votre enquête. L'IA proposera une structure de formulaire que vous pourrez ensuite affiner.",
    aiGenerationModal_projectNameLabel: "Nom du Projet",
    aiGenerationModal_projectNamePlaceholder: "Ex: Enquête de santé à Ségou",
    aiGenerationModal_promptLabel: "Description de votre besoin",
    aiGenerationModal_promptPlaceholder: "Ex: Je veux créer un formulaire pour suivre la vaccination des enfants de moins de 5 ans. J'ai besoin de collecter des informations sur le ménage, l'enfant, et les vaccins reçus...",
    aiGenerationModal_generatingButton: "Génération en cours...",
    aiGenerationModal_generateButton: "Générer le Formulaire",

    // Header
    header_designer: "Designer",
    header_collecte: "Collect & Test",
    header_offline: "Hors-ligne",
    header_goHome: "Retour à l'accueil",
    
    // Project Switcher
    projectManager: "Gestionnaire de Projets",
    createNewProject: "Créer un nouveau projet",
    newProjectNamePlaceholder: "Nom du projet...",
    create: "Créer",
    existingProjects: "Projets existants",
    active: "Actif",
    activate: "Activer",
    delete: "Supprimer",
    noProjects: "Aucun projet trouvé.",
    confirmDeleteProject: "Êtes-vous sûr de vouloir supprimer le projet '{{projectName}}' ? Cette action est irréversible.",
    confirmCloseProject: "Êtes-vous sûr de vouloir fermer le projet et retourner à l'accueil ?",

    // Login
    login_title: "Connexion",
    login_subtitle: "Connectez-vous pour commencer",
    login_accessForEnumerators: "Accès Enquêteur / Manager",
    login_enterAccessCode: "Entrez le code d'accès fourni par l'administrateur pour accéder à un projet.",
    login_accessCodePlaceholder: "Code d'accès...",
    login_validate: "Valider",
    login_adminAccess: "Accès Administrateur",
    login_continueAsAdmin: "Continuer comme Administrateur",
    login_invalidCode: "Code d'accès invalide ou projet non trouvé.",

    // Right Sidebar
    aiAssistant: "Assistant IA",
    editTab: "Édition",
    logicAudit: "Audit",
    log: "Log",
    history: "Historique",
    selectQuestionToEnable: "Sélectionnez une question pour activer cet onglet",
    selectQuestionToEdit: "Sélectionnez une question dans le panneau de gauche pour l'éditer ici.",

    // AI Agent
    aiAgent_personas: "Personas Actives",
    aiAgent_placeholder: "Posez une question, demandez une modification...",
    aiAgent_sending: "Envoi...",
    aiAgent_send: "Envoyer",
    aiAgent_offline_message: "L'assistant IA est indisponible en mode hors-ligne.",

    // Left Sidebar
    noLabel: "Sans libellé",
    leftSidebar_addGroup: "Ajouter un groupe",

    // Form Preview
    formPreview_noActiveProject: "Aucun projet actif à prévisualiser.",
    formPreview_noQuestionsTitle: "Aucune question visible",
    formPreview_noQuestionsDescription: "Toutes les questions sont masquées par des conditions de pertinence. Vérifiez les conditions logiques ou modifiez les valeurs des questions précédentes.",
    formPreview_selectCaseTitle: "Sélectionnez un cas",
    formPreview_selectCaseDescription: "Choisissez une soumission dans la barre de gauche pour commencer la saisie ou la visualisation.",

    // Data View
    dataView_exportScripts: "Scripts d'Analyse",
    
    // Collecte Sidebar
    collecte_noSubmissions: "Aucune soumission pour ce projet.",
    collecte_newEntry: "Nouvelle entrée",
    collecte_simulation: "Mode Simulation",
    collecte_synchronize: "Synchroniser",
    collecte_sync_tooltip: "Synchroniser les données avec le serveur",

    // Simulation Modal
    simulationModal_title: "Mode Simulation",
    simulationModal_description: "Testez votre formulaire en conditions réelles ou laissez une IA le remplir pour vous.",
    simulationModal_finalize: "Finaliser et Sauvegarder",

    // Audit Log
    auditLog_export: "Exporter CSV",

    // Logic Builder
    logicBuilder_title: "Assistant de Logique",
    logicBuilder_description: "Construisez une condition de pertinence étape par étape.",
    logicBuilder_question_label: "SI la question...",
    logicBuilder_operator_label: "... a pour condition...",
    logicBuilder_value_label: "... la valeur...",
    logicBuilder_add_condition: "Ajouter la Condition",
    logicBuilder_helper_button: "Assistant Logique",

    // Language Manager
    lang_add_success: "Langue '{{lang}}' ajoutée.",
    lang_code_placeholder: "Code langue (ex: en, bm)",
    lang_code_hint: "Utilisez les codes ISO 639-1.",

    // User Management
    userManagement_title: "Gestion des Utilisateurs",
    userManagement_description: "Créez des codes d'accès pour vos collaborateurs. Chaque code est lié à ce projet uniquement.",
    userManagement_namePlaceholder: "Nom de l'utilisateur...",
    userManagement_add: "Ajouter",
    userManagement_copyLink: "Copier le code",
    userManagement_codeCopied: "Code d'accès copié !",
    userManagement_noUsers: "Aucun utilisateur géré pour ce projet.",
    roleEnumerator: "Enquêteur",
    roleManager: "Chef de projet",
    roleAdmin: "Administrateur",

    // Data Chat
    dataChat_title: "Chat d'Analyse de Données",
    dataChat_placeholder: "Posez une question sur vos données...",
    dataChat_sendMessage: "Envoyer",

    // Dashboard
    dashboard_noData: "Aucune donnée de soumission à visualiser pour le moment.",
    dashboard_qualityAudit: "Audit Qualité des Données par IA",
    dashboard_qualityAuditDescription: "L'IA va analyser un échantillon de vos dernières soumissions pour détecter des anomalies ou des problèmes de qualité.",
    dashboard_auditing: "Analyse en cours...",
    dashboard_runAudit: "Lancer l'Audit",

    // Analysis Script Modal
    analysisScriptModal_title: "Générateur de Script d'Analyse",
    analysisScriptModal_description: "Générez un script de base en R ou Stata pour démarrer l'analyse de vos données.",
    analysisScriptModal_generating: "Génération...",
    analysisScriptModal_generateFor: "Générer pour {{lang}}",

    // Constitution
    constitution_title: "Constitution du Projet",
    constitution_description: "Définissez ici les règles et le contexte immuables que l'IA devra toujours respecter pour ce projet. Ces instructions ont la plus haute priorité.",
    constitution_placeholder: "Exemple:\n- Toutes les questions doivent commencer par un préfixe basé sur leur groupe.\n- Ne jamais poser de questions sur le revenu direct, utiliser des proxys.\n- Le terme 'chef de ménage' désigne la personne qui apporte le plus de ressources.",
    cancel: "Annuler",
    save: "Sauvegarder",

    // Visual Logic
    visualLogic_title: "Architecte de Logique Visuel",
    visualLogic_description: "Visualisez et modifiez le flux de votre formulaire.",
    visualLogic_aiHelper: "Ex: 'Après la question sur l'agriculture, si l'enquêté cultive du coton, poser une série de 3 questions sur les pesticides utilisés.'",
    visualLogic_generateLogic: "Générer la Logique",
    visualLogic_saveAndApply: "Sauvegarder et Appliquer",
    
    // Realtime Coach
    realtimeCoach_title: "Coach en Temps Réel",
    realtimeCoach_description: "Recevez des conseils de l'IA pendant que vous construisez.",

    // Post-Login Welcome Screen
    postLoginWelcomeSubtitle: "Votre assistant intelligent pour la conception et la gestion de formulaires KoboToolbox.",
    postLoginCreateAITitle: "Créer avec l'IA",
    postLoginCreateAIDesc: "Décrivez votre projet et laissez l'IA générer une première version de votre formulaire.",
    postLoginImportTitle: "Importer un formulaire",
    postLoginImportDesc: "Importez un formulaire existant depuis un fichier Word (.docx) pour le structurer avec l'IA.",
    postLoginImportSovereignTitle: "Importer un projet ISMA",
    postLoginImportSovereignDesc: "Chargez un projet complet sauvegardé depuis ISMA au format .json.",
    postLoginDemoTitle: "Explorer la Démo",
    postLoginDemoDesc: "Découvrez les fonctionnalités de l'application avec un projet d'exemple pré-chargé.",
  },
  en: {
    // Welcome Screen
    welcomeSubtitle: "Your intelligent assistant for designing and managing KoboToolbox forms.",
    welcomeCreateAITitle: "Create with AI",
    welcomeCreateAIDesc: "Describe your project and let the AI generate a first draft of your form.",
    welcomeImportTitle: "Import a form",
    welcomeImportDesc: "Import an existing form from a Word file (.docx) to structure it with AI.",
    welcomeImportSovereignTitle: "Import ISMA project",
    welcomeImportSovereignDesc: "Load a complete project saved from ISMA in .json format.",
    welcomeDemoTitle: "Explore the Demo",
    welcomeDemoDesc: "Discover the application's features with a pre-loaded example project.",
    
    // Notifications
    notificationImporting: "Importing project...",
    notificationImportSuccess: "Project imported successfully!",
    notificationSovereignImportSuccess: "ISMA project imported successfully!",
    notificationSovereignImportError: "Error importing JSON file. Is it valid?",
    notificationImportError: "Error during import",
    notification_aiGenerationStart: "AI form generation in progress...",
    notification_aiGenerationSuccess: "Form generated successfully!",
    notification_sync_started: "Synchronization started...",
    notification_sync_success: "Synchronization completed successfully!",
    notification_sync_error: "Synchronization failed.",
    confirmSaveChanges: "Are you sure you want to save the changes?",
    notification_questionSaved: "Question '{{questionName}}' saved successfully.",

    // AI Generation Modal
    aiGenerationModal_title: "Create Project with AI",
    aiGenerationModal_description: "Describe the purpose of your survey. The AI will propose a form structure that you can then refine.",
    aiGenerationModal_projectNameLabel: "Project Name",
    aiGenerationModal_projectNamePlaceholder: "Ex: Health survey in Ségou",
    aiGenerationModal_promptLabel: "Description of your need",
    aiGenerationModal_promptPlaceholder: "Ex: I want to create a form to track the vaccination of children under 5. I need to collect information about the household, the child, and the vaccines received...",
    aiGenerationModal_generatingButton: "Generating...",
    aiGenerationModal_generateButton: "Generate Form",

    // Header
    header_designer: "Designer",
    header_collecte: "Collect & Test",
    header_offline: "Offline",
    header_goHome: "Return to home screen",
    
    // Project Switcher
    projectManager: "Project Manager",
    createNewProject: "Create a new project",
    newProjectNamePlaceholder: "Project name...",
    create: "Create",
    existingProjects: "Existing projects",
    active: "Active",
    activate: "Activate",
    delete: "Delete",
    noProjects: "No projects found.",
    confirmDeleteProject: "Are you sure you want to delete the project '{{projectName}}'? This action is irreversible.",
    confirmCloseProject: "Are you sure you want to close the project and return to the welcome screen?",
    
    // Login
    login_title: "Login",
    login_subtitle: "Log in to get started",
    login_accessForEnumerators: "Enumerator / Manager Access",
    login_enterAccessCode: "Enter the access code provided by the administrator to access a project.",
    login_accessCodePlaceholder: "Access code...",
    login_validate: "Validate",
    login_adminAccess: "Administrator Access",
    login_continueAsAdmin: "Continue as Administrator",
    login_invalidCode: "Invalid access code or project not found.",
    
    // Right Sidebar
    aiAssistant: "AI Assistant",
    editTab: "Edit",
    logicAudit: "Audit",
    log: "Log",
    history: "History",
    selectQuestionToEnable: "Select a question to enable this tab",
    selectQuestionToEdit: "Select a question in the left panel to edit it here.",
    
    // AI Agent
    aiAgent_personas: "Active Personas",
    aiAgent_placeholder: "Ask a question, request a change...",
    aiAgent_sending: "Sending...",
    aiAgent_send: "Send",
    aiAgent_offline_message: "The AI assistant is unavailable in offline mode.",

    // Left Sidebar
    noLabel: "No label",
    leftSidebar_addGroup: "Add group",
    
    // Form Preview
    formPreview_noActiveProject: "No active project to preview.",
    formPreview_noQuestionsTitle: "No visible questions",
    formPreview_noQuestionsDescription: "All questions are hidden by relevance conditions. Check the logic conditions or modify the values of previous questions.",
    formPreview_selectCaseTitle: "Select a Case",
    formPreview_selectCaseDescription: "Choose a submission from the left sidebar to start data entry or viewing.",

    // Data View
    dataView_exportScripts: "Analysis Scripts",
    
    // Collecte Sidebar
    collecte_noSubmissions: "No submissions for this project.",
    collecte_newEntry: "New Entry",
    collecte_simulation: "Simulation Mode",
    collecte_synchronize: "Synchronize",
    collecte_sync_tooltip: "Synchronize data with the server",
    
    // Simulation Modal
    simulationModal_title: "Simulation Mode",
    simulationModal_description: "Test your form in real conditions or let an AI fill it out for you.",
    simulationModal_finalize: "Finalize and Save",

    // Audit Log
    auditLog_export: "Export CSV",

    // Logic Builder
    logicBuilder_title: "Logic Assistant",
    logicBuilder_description: "Build a relevance condition step-by-step.",
    logicBuilder_question_label: "IF the question...",
    logicBuilder_operator_label: "... has the condition...",
    logicBuilder_value_label: "... the value...",
    logicBuilder_add_condition: "Add Condition",
    logicBuilder_helper_button: "Logic Assistant",
    
    // Language Manager
    lang_add_success: "Language '{{lang}}' added.",
    lang_code_placeholder: "Language code (e.g., en, bm)",
    lang_code_hint: "Use ISO 639-1 codes.",
    
    // User Management
    userManagement_title: "User Management",
    userManagement_description: "Create access codes for your collaborators. Each code is linked to this project only.",
    userManagement_namePlaceholder: "User's name...",
    userManagement_add: "Add",
    userManagement_copyLink: "Copy code",
    userManagement_codeCopied: "Access code copied!",
    userManagement_noUsers: "No managed users for this project.",
    roleEnumerator: "Enumerator",
    roleManager: "Project Manager",
    roleAdmin: "Administrator",
    
    // Data Chat
    dataChat_title: "Data Analysis Chat",
    dataChat_placeholder: "Ask a question about your data...",
    dataChat_sendMessage: "Send",
    
    // Dashboard
    dashboard_noData: "No submission data to visualize yet.",
    dashboard_qualityAudit: "AI Data Quality Audit",
    dashboard_qualityAuditDescription: "The AI will analyze a sample of your latest submissions to detect anomalies or quality issues.",
    dashboard_auditing: "Auditing...",
    dashboard_runAudit: "Run Audit",

    // Analysis Script Modal
    analysisScriptModal_title: "Analysis Script Generator",
    analysisScriptModal_description: "Generate a basic script in R or Stata to start analyzing your data.",
    analysisScriptModal_generating: "Generating...",
    analysisScriptModal_generateFor: "Generate for {{lang}}",

    // Constitution
    constitution_title: "Project Constitution",
    constitution_description: "Define the immutable rules and context that the AI must always respect for this project. These instructions have the highest priority.",
    constitution_placeholder: "Example:\n- All questions must start with a prefix based on their group.\n- Never ask about direct income, use proxies.\n- The term 'head of household' refers to the person who provides the most resources.",
    cancel: "Cancel",
    save: "Save",
    
    // Visual Logic
    visualLogic_title: "Visual Logic Architect",
    visualLogic_description: "Visualize and modify your form's flow.",
    visualLogic_aiHelper: "Ex: 'After the question about agriculture, if the respondent grows cotton, ask a series of 3 questions about the pesticides used.'",
    visualLogic_generateLogic: "Generate Logic",
    visualLogic_saveAndApply: "Save and Apply",
    
    // Realtime Coach
    realtimeCoach_title: "Realtime Coach",
    realtimeCoach_description: "Get AI tips as you build.",

    // Post-Login Welcome Screen
    postLoginWelcomeSubtitle: "Your intelligent assistant for designing and managing KoboToolbox forms.",
    postLoginCreateAITitle: "Create with AI",
    postLoginCreateAIDesc: "Describe your project and let the AI generate a first version of your form.",
    postLoginImportTitle: "Import a form",
    postLoginImportDesc: "Import an existing form from a Word file (.docx) to structure it with AI.",
    postLoginImportSovereignTitle: "Import ISMA project",
    postLoginImportSovereignDesc: "Load a complete project saved from ISMA in .json format.",
    postLoginDemoTitle: "Explore the Demo",
    postLoginDemoDesc: "Discover the application's features with a pre-loaded example project.",
  },
  bm: {
    // Bambara translations
    welcomeSubtitle: "War i ka KoboToolbox formulɛrɛ sɛgɛsɛgɛli ni i ka baarakɛyɔrɔ la.",
    welcomeCreateAITitle: "AI ni sɛgɛsɛgɛ",
    welcomeCreateAIDesc: "I ka projetɔ sɔsɔ AI bɛ i ka formulɛrɛ minɛn sɛgɛsɛgɛ i bɛ se ka dɛsɛgɛ.",
    welcomeImportTitle: "Formulɛrɛ kɔsɔn",
    welcomeImportDesc: "Formulɛrɛ minɛn kɔsɔn Word dosiyɛ kɔnɔ (.docx) AI ni ka a sɛgɛsɛgɛ.",
    welcomeImportSovereignTitle: "ISMA Projetɔ kɔsɔn",
    welcomeImportSovereignDesc: "Projetɔ timinɛn kɔsɔn ISMA kɔnɔ .json fɔrmat la.",
    welcomeDemoTitle: "Demo sɛgɛsɛgɛ",
    welcomeDemoDesc: "Aplikasyon ka fɛnw sɛgɛsɛgɛ demo projetɔ ni.",

    // Language selector
    languageSelector: "Kan",
    language_french: "Faransi",
    language_english: "Angilɛ",
    language_bambara: "Bamanankan",
    language_fulfulde: "Fulfulde",
    language_soninke: "Soninké",
    language_dogon: "Dogon",

    // Branding
    branding_title: "Paramètres institutionnels",
    branding_logo: "Lafɛnw logo",
    branding_logoUpload: "Logo kɔsɔn",
    branding_logoRemove: "Logo bɔ",
    branding_institutionName: "Lafɛnw tɔgɔ",
    branding_ministerialCode: "Ministɛri kodɛ",
    branding_partnerInfo: "Partner waleyaw",
    branding_save: "Sɛgɛsɛgɛli kɛ",

    // Regional settings
    regional_title: "Paramètres régionaux",
    regional_region: "Dugukolo",
    regional_culturalContext: "Kulturɛ kɔrɔ",
    regional_localTerms: "Dugukolo kumasenw ka sigi",

    // Regions
    region_bamako: "Bamakɔ",
    region_sikasso: "Sikaso",
    region_segou: "Sɛgu",
    region_mopti: "Mɔpti",
    region_tombouctou: "Tɔmbuktɔ",
    region_gao: "Gao",
    region_kayes: "Kayi",
    region_koulikoro: "Kulikɔrɔ",

    // Basic translations
    notificationImporting: "Projetɔ kɔsɔnbali la...",
    notificationImportSuccess: "Projetɔ kɔsɔnnen don na!",
    cancel: "A bɔ",
    save: "Kɛ",
    header_designer: "Sɛgɛsɛgɛli",
    header_collecte: "Kɔsɔnbali ni tɛstɛ",
    dashboard_noData: "Soumission don o tɛ yɛlɛman fɛ.",
  },
  ff: {
    // Fulfulde translations
    welcomeSubtitle: "Jaidorde am inteleligen maa no woodi KoboToolbox formere sifaade e jokkorde.",
    welcomeCreateAITitle: "Sos AI",
    welcomeCreateAIDesc: "Humpitu proje am ngam AI sos formere adannde maa.",
    welcomeImportTitle: "Jokku Formere",
    welcomeImportDesc: "Jokku formere woodnde iwde e fiilde Word (.docx) ngam sifaade AI.",
    welcomeImportSovereignTitle: "Jokku ISMA proje",
    welcomeImportSovereignDesc: "Loow proje timminnde iwde ISMA e .json format.",

    // Language selector
    languageSelector: "Ɗemngal",
    language_french: "Faransiire",
    language_english: "Engeleere",
    language_bambara: "Bambara",
    language_fulfulde: "Fulfulde",
    language_soninke: "Soxinkeere",
    language_dogon: "Dogon",

    // Branding
    branding_title: "Paramètres institutionnels",
    branding_logo: "Jameere logo",
    branding_logoUpload: "Jokku logo",
    branding_logoRemove: "Ittu logo",
    branding_institutionName: "Innde jameere",
    branding_ministerialCode: "Kode jameere",
    branding_partnerInfo: "Humpitu jokkondiral",
    branding_save: "Danndu sifaade",

    // Regional settings
    regional_title: "Paramètres régionaux",
    regional_region: "Nokku",
    regional_culturalContext: "Firo kultural",
    regional_localTerms: "Kumme nokkuuje huutoreede",

    // Regions
    region_bamako: "Bamakoo",
    region_sikasso: "Sikassoo",
    region_segou: "Seekoo",
    region_mopti: "Mopti",
    region_tombouctou: "Tumbuktu",
    region_gao: "Gawoo",
    region_kayes: "Kayeeji",
    region_koulikoro: "Koolikoroo",

    cancel: "Haɗu",
    save: "Danndu",
    header_designer: "Sifaade",
    header_collecte: "Roɓɓindiral e Ƴeewndal",
    dashboard_noData: "Alaa keɓe roɓɓindirɗe ngam yiytude.",

    // Notifications (completions and approximations for Fulfulde)
    notificationImporting: "Jokku proje...",
    notificationImportSuccess: "Proje jokkude jam!",
    notificationSovereignImportSuccess: "ISMA proje jokkude jam!",
    notificationSovereignImportError: "JSON fiilde jokku error. Yeeso ma?",
    notificationImportError: "Jokku error",
    notification_aiGenerationStart: "AI form sos in progress...",
    notification_aiGenerationSuccess: "Form sos jam!",
    notification_sync_started: "Senkron started...",
    notification_sync_success: "Senkron jam!",
    notification_sync_error: "Senkron failed.",
    confirmSaveChanges: "Yeeso ma danndu changes?",
    notification_questionSaved: "Question '{{questionName}}' danndude jam.",

    // AI Generation Modal
    aiGenerationModal_title: "Sos Proje AI",
    aiGenerationModal_description: "Humpitu sondaje but. AI form sifaade danndu.",
    aiGenerationModal_projectNameLabel: "Proje Innde",
    aiGenerationModal_projectNamePlaceholder: "Ex: Seekoo sante sondaje",
    aiGenerationModal_promptLabel: "Humpitu need",
    aiGenerationModal_promptPlaceholder: "Ex: Mi woodi form vaksin banu 5 an. Mi keɓe info famil, banu, vaksin...",
    aiGenerationModal_generatingButton: "Sos...",
    aiGenerationModal_generateButton: "Sos Form",

    // Header
    header_designer: "Sifaade",
    header_collecte: "Roɓɓindiral e Ƴeewndal",
    header_offline: "Offline",
    header_goHome: "Rewwo home",

    // Project Switcher
    projectManager: "Proje Jokkorde",
    createNewProject: "Proje min sos",
    newProjectNamePlaceholder: "Proje innde...",
    create: "Sos",
    existingProjects: "Proje min",
    active: "Active",
    activate: "Activate",
    delete: "Ittu",
    noProjects: "Proje tɛ.",
    confirmDeleteProject: "Yeeso ma ittu proje '{{projectName}}'? Irreversible.",
    confirmCloseProject: "Yeeso ma close proje home?",

    // Login
    login_title: "Login",
    login_subtitle: "Login danndu",
    login_accessForEnumerators: "Enumerator / Manager",
    login_enterAccessCode: "Admin kod enter proje access.",
    login_accessCodePlaceholder: "Kod...",
    login_validate: "Yeeso",
    login_adminAccess: "Admin Access",
    login_continueAsAdmin: "Continue Admin",
    login_invalidCode: "Kod tɛ yeeso ko proje tɛ.",

    // Right Sidebar
    aiAssistant: "AI Jaidorde",
    editTab: "Edit",
    logicAudit: "Audit",
    log: "Log",
    history: "Tarix",
    selectQuestionToEnable: "Question yeeso enable",
    selectQuestionToEdit: "Gojji question left edit.",

    // AI Agent
    aiAgent_personas: "Active Personas",
    aiAgent_placeholder: "Question yeeso, change yeeso...",
    aiAgent_sending: "Sending...",
    aiAgent_send: "Send",
    aiAgent_offline_message: "AI jaidorde offline tɛ.",

    // Left Sidebar
    noLabel: "Innde tɛ",
    leftSidebar_addGroup: "Guruppe ɲɔgɔn",

    // Form Preview
    formPreview_noActiveProject: "Active proje tɛ.",
    formPreview_noQuestionsTitle: "Question tɛ visible",
    formPreview_noQuestionsDescription: "Tulon question masquɗe. Logic yeeso ko previous value change.",
    formPreview_selectCaseTitle: "Case yeeso",
    formPreview_selectCaseDescription: "Soumission gojji left entry view.",

    // Data View
    dataView_exportScripts: "Analiz Scripts",

    // Collecte Sidebar
    collecte_noSubmissions: "Proje soumission tɛ.",
    collecte_newEntry: "Min Entry",
    collecte_simulation: "Simulation Mode",
    collecte_synchronize: "Senkron",
    collecte_sync_tooltip: "Don senkron server",

    // Simulation Modal
    simulationModal_title: "Simulation Mode",
    simulationModal_description: "Form tɛst real ko AI fill.",
    simulationModal_finalize: "Finalize Danndu",

    // Audit Log
    auditLog_export: "CSV Export",

    // Logic Builder
    logicBuilder_title: "Logic Jaidorde",
    logicBuilder_description: "Relevance kondisyon step step.",
    logicBuilder_question_label: "IF question...",
    logicBuilder_operator_label: "... kondisyon...",
    logicBuilder_value_label: "... value...",
    logicBuilder_add_condition: "Kondisyon ɲɔgɔn",
    logicBuilder_helper_button: "Logic Jaidorde",

    // Language Manager
    lang_add_success: "Ɗemngal '{{lang}}' ɲɔgɔn.",
    lang_code_placeholder: "Ɗemngal kod (ex: en, bm)",
    lang_code_hint: "ISO 639-1 kod.",

    // User Management
    userManagement_title: "Jokkorde Jokkorde",
    userManagement_description: "Kod sos kolaborateur. Kod proje min.",
    userManagement_namePlaceholder: "Jokkorde innde...",
    userManagement_add: "ɲɔgɔn",
    userManagement_copyLink: "Kod Kopy",
    userManagement_codeCopied: "Kod kopy jam!",
    userManagement_noUsers: "Proje jokkorde tɛ.",
    roleEnumerator: "Enumerator",
    roleManager: "Proje Manager",
    roleAdmin: "Admin",

    // Data Chat
    dataChat_title: "Don Analiz Chat",
    dataChat_placeholder: "Don question...",
    dataChat_sendMessage: "Send",

    // Dashboard
    dashboard_noData: "Alaa keɓe roɓɓindirɗe ngam yiytude.",
    dashboard_qualityAudit: "AI Don Kalite Audit",
    dashboard_qualityAuditDescription: "AI banu soumission anomal detect.",
    dashboard_auditing: "Auditing...",
    dashboard_runAudit: "Run Audit",

    // Analysis Script Modal
    analysisScriptModal_title: "Analiz Script Sos",
    analysisScriptModal_description: "R ko Stata script sos analiz danndu.",
    analysisScriptModal_generating: "Sos...",
    analysisScriptModal_generateFor: "Sos {{lang}}",

    // Constitution
    constitution_title: "Proje Konstituson",
    constitution_description: "AI rɛgɛl konteks immuable. Highest priorite.",
    constitution_placeholder: "Ex:\n- Tulon question prefix guruppe.\n- Dirɛkt income tɛ, proxy.\n- 'Head household' resɔrs min.",
    cancel: "Haɗu",
    save: "Danndu",

    // Visual Logic
    visualLogic_title: "Vizuel Logic Arkitɛk",
    visualLogic_description: "Form flux vizuel change.",
    visualLogic_aiHelper: "Ex: 'Agriculture question ban, cotton kuliba, 3 question pestisid.'",
    visualLogic_generateLogic: "Sos Logic",
    visualLogic_saveAndApply: "Danndu Apply",

    // Realtime Coach
    realtimeCoach_title: "Realtime Coach",
    realtimeCoach_description: "AI tips build.",

    // Post-Login Welcome Screen
    postLoginWelcomeSubtitle: "Jaidorde am inteleligen maa no woodi KoboToolbox formere sifaade e jokkorde.",
    postLoginCreateAITitle: "Sos AI",
    postLoginCreateAIDesc: "Humpitu proje am ngam AI sos formere adannde maa.",
    postLoginImportTitle: "Jokku Formere",
    postLoginImportDesc: "Jokku formere woodnde iwde e fiilde Word (.docx) ngam sifaade AI.",
    postLoginImportSovereignTitle: "Jokku ISMA proje",
    postLoginImportSovereignDesc: "Loow proje timminnde iwde ISMA e .json format.",
    postLoginDemoTitle: "Demo sifaade",
    postLoginDemoDesc: "Aplikasyon fɛnw sifaade demo proje ni.",
  },
  snk: {
    // Soninké translations
    welcomeSubtitle: "I ga intelijan asistan ga KoboToolbox formulɛr ga sɛgɛrɛ ni i ga juwal.",
    welcomeCreateAITitle: "Sɔs AI ni",
    welcomeCreateAIDesc: "I ga proje sɔsɔ AI bɛ i ga formulɛr minɛn sɔs i bɛ se ka dɛsɛgɛ.",
    welcomeImportTitle: "Formulɛr kɔsɔn",
    welcomeImportDesc: "Formulɛr minɛn kɔsɔn Word dosiyɛ kɔnɔ (.docx) AI ni ka a sɛgɛsɛgɛ.",

    // Language selector
    languageSelector: "Kan",
    language_french: "Faransi",
    language_english: "Angilɛ",
    language_bambara: "Bambara",
    language_fulfulde: "Fulfulde",
    language_soninke: "Soninké",
    language_dogon: "Dogon",

    // Branding
    branding_title: "Paramètres institutionnels",
    branding_logo: "Institisyon ga logo",
    branding_logoUpload: "Logo kɔsɔn",
    branding_logoRemove: "Logo bɔ",
    branding_institutionName: "Institisyon ga tɔgɔ",
    branding_ministerialCode: "Ministɛr ga kodɛ",
    branding_partnerInfo: "Partner ga waleya",
    branding_save: "Sɛgɛrɛ kɛ",

    // Regional settings
    regional_title: "Lɛɛl ga sɛgɛrɛ",
    regional_region: "Lɛɛl",
    regional_culturalContext: "Kultur ga kɔrɔ",
    regional_localTerms: "Lɛɛl ga kuma ka sigi",

    // Regions
    region_bamako: "Bamakɔ",
    region_sikasso: "Sikaso",
    region_segou: "Sɛgu",
    region_mopti: "Mɔpti",
    region_tombouctou: "Tɔmbuktɔ",
    region_gao: "Gao",
    region_kayes: "Kayi",
    region_koulikoro: "Kulikɔrɔ",

    cancel: "A bɔ",
    save: "Kɛ",
    header_designer: "Sɛgɛrɛ",
    header_collecte: "Kɔsɔnbali ni tɛstɛ",
    dashboard_noData: "Soumission don o tɛ yɛlɛman fɛ.",
  },
  dgo: {
    // Dogon translations (simplified)
    welcomeSubtitle: "Iye intelijen asistan ye KoboToolbox formulɛr sɛgɛrɛ ni iye juwal.",
    welcomeCreateAITitle: "Sɔs AI ni",
    welcomeCreateAIDesc: "Iye proje sɔsɔ AI bɛ iye formulɛr minɛn sɔs iye bɛ se ka dɛsɛgɛ.",

    // Language selector
    languageSelector: "Kan",
    language_french: "Faransi",
    language_english: "Angilɛ",
    language_bambara: "Bambara",
    language_fulfulde: "Fulfulde",
    language_soninke: "Soninké",
    language_dogon: "Dogon",

    // Branding
    branding_title: "Paramètres institutionnels",
    branding_logo: "Institisyon ga logo",
    branding_logoUpload: "Logo kɔsɔn",
    branding_logoRemove: "Logo bɔ",
    branding_institutionName: "Institisyon ga tɔgɔ",
    branding_ministerialCode: "Ministɛr ga kodɛ",
    branding_partnerInfo: "Partner ga waleya",
    branding_save: "Sɛgɛrɛ kɛ",

    // Regional settings
    regional_title: "Lɛɛl ga sɛgɛrɛ",
    regional_region: "Lɛɛl",
    regional_culturalContext: "Kultur ga kɔrɔ",
    regional_localTerms: "Lɛɛl ga kuma ka sigi",

    // Regions
    region_bamako: "Bamakɔ",
    region_sikasso: "Sikaso",
    region_segou: "Sɛgu",
    region_mopti: "Mɔpti",
    region_tombouctou: "Tɔmbuktɔ",
    region_gao: "Gao",
    region_kayes: "Kayi",
    region_koulikoro: "Kulikɔrɔ",

    cancel: "A bɔ",
    save: "Kɛ",
    header_designer: "Sɛgɛrɛ",
    header_collecte: "Kɔsɔnbali ni tɛstɛ",
    dashboard_noData: "Soumission don o tɛ yɛlɛman fɛ.",
  },
};
