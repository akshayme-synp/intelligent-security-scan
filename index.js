const core = require('@actions/core');
// const shell = require('shelljs');
const fs = require('fs');
// const { promisify } = require('util');
// const exec = promisify(require('child_process').exec)

const PowerShell = require('node-powershell');

PowerShell.$`echo "hello from PowerShell"`;

try {
	const ioServerUrl = core.getInput('ioServerUrl');
	var ioServerToken = core.getInput('ioServerToken');
	const workflowServerUrl = core.getInput('workflowServerUrl');
	const workflowVersion = core.getInput('workflowVersion');
	const ioManifestUrl = core.getInput('ioManifestUrl');
	const additionalWorkflowArgs = core.getInput('additionalWorkflowArgs')
	const stage = core.getInput('stage')
	var rcode = -1
	
	let scmType = "github"
	let scmOwner = process.env.GITHUB_REPOSITORY.split('/')[0]
	let scmRepoName = process.env.GITHUB_REPOSITORY.split('/')[1]
	let scmBranchName = ""
	let githubUsername = process.env.GITHUB_ACTOR
	let asset_id = process.env.GITHUB_REPOSITORY

	if( process.env.GITHUB_EVENT_NAME === "push" ){
		scmBranchName = process.env.GITHUB_REF.split('/')[2]
	}
	else if( process.env.GITHUB_EVENT_NAME === "pull_request") {
		scmBranchName = process.env.GITHUB_HEAD_REF
	}

	console.log(process.env.GITHUB_REPOSITORY);

	// Irrespective of Machine this should be invoked
	if(stage.toUpperCase() === "IO") {
		console.log("Triggering prescription")
		
        PowerShell.$`Invoke-WebRequest https://raw.githubusercontent.com/akshayme-synp/insecure-bank/master/prescription.ps1 -SkipHttpErrorCheck -OutFile 'prescription.ps1' -PassThru`;
        
        
		PowerShell.$`prescription.ps1 -stage 'io' -io_url '${ioServerUrl}' -io_token '${ioServerToken}' -project_name '${asset_id}' -scm_type '${scmType}' -scm_owner '${scmOwner}' -scm_repo_name '${scmRepoName}' -scm_branch_name '${scmBranchName}' -github_username '${githubUsername}' -github_access_token '${{secrets.SCM_ACCESS_TOKEN}}' -gitlab_url 'https://www.gitlab.com' -gitlab_token '' -persona 'developer' -release_type 'minor' -polaris_project_name 'akshayme-synp/insecure-bank' -polaris_server_url '${{secrets.POLARIS_SERVER_URL}}' -polaris_access_token '${{secrets.POLARIS_ACCESS_TOKEN}}' -is_sast_enabled 'true' ${additionalWorkflowArgs}`;
		
		
		let rawdata = fs.readFileSync('result.json');
		let result_json = JSON.parse(rawdata);
		let is_sast_enabled = result_json.security.activities.sast.enabled
		let is_sca_enabled = result_json.security.activities.sca.enabled
		console.log('Is SAST Enabled: '+is_sast_enabled);
		console.log('Is SCA Enabled: '+is_sca_enabled);

        PowerShell.$`echo "::set-output name=sastScan::$is_sast_enabled"`
        PowerShell.$`echo "::set-output name=scaScan::$is_sca_enabled"`
	}
	// else if (stage.toUpperCase() === "WORKFLOW")  {
	// 	console.log("Adding scan tool parameters")
	// 	// file doesn't exist
	// 	if (!fs.existsSync("prescription.sh")) {
	// 		// shell.exec(`wget https://sigdevsecops.blob.core.windows.net/intelligence-orchestration/${workflowVersion}/prescription.sh`)
	// 		shell.exec(`wget https://raw.githubusercontent.com/synopsys-sig/io-artifacts/${workflowVersion}/prescription.sh`)
	// 		shell.exec(`chmod +x prescription.sh`)
	// 		shell.exec(`sed -i -e 's/\r$//' prescription.sh`)
	// 	}
	// 	var wffilecode = shell.exec(`./prescription.sh --io.url=${ioServerUrl} --io.token=${ioServerToken} --io.manifest.url=${ioManifestUrl} --stage=${stage} --workflow.version=${workflowVersion} --workflow.url=${workflowServerUrl} --project.name=${asset_id} --asset.id=${asset_id} --polaris.project.name=${asset_id} --scm.type=${scmType} --scm.owner=${scmOwner} --scm.repo.name=${scmRepoName} --scm.branch.name=${scmBranchName} --github.username=${githubUsername} ${additionalWorkflowArgs}`).code;
	// 	if (wffilecode == 0) {
	// 		console.log("Workflow file generated successfullly....Calling WorkFlow Engine")
	// 		var wfclientcode = shell.exec(`java -jar WorkflowClient.jar --workflowengine.url="${workflowServerUrl}" --io.manifest.path=synopsys-io.json`).code;
	// 		if (wfclientcode != 0) {
	// 			core.error(`Error: Workflow failed and returncode is ${wfclientcode}`);
	// 			core.setFailed(error.message);
	// 		}
	// 	}
	// 	else {
	// 		core.error(`Error: Workflow file generation failed and returncode is ${wffilecode}`);
	// 		core.setFailed(error.message);
	// 	}
	// }
	else {
		core.error(`Error: Invalid stage given as input`);
		core.setFailed(error.message);
	}
}

catch (error) {
	core.setFailed(error.message);
}
