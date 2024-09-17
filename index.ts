import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as std from "@pulumi/std";

const github_token_secret = await gcp.secretmanager.getSecretVersion(
  // "github-token-secret",
  {
    secret: "github-token-secret",
    // secretId: "github-token-secret",
    // replication: {
    //   auto: {},
    // },
  }
);
const DATABASE_URL = await gcp.secretmanager.getSecretVersion({
  secret: "DATABASE_URL",
});
// const github_token_secret_version = new gcp.secretmanager.SecretVersion(
//   "github-token-secret-version",
//   {
//     secret: github_token_secret.id,
//     secretData: std
//       .file({
//         input: "my-github-token.txt",
//       })
//       .then((invoke) => invoke.result),
//   }
// );

// const p4sa_secretAccessor = gcp.organizations.getIAMPolicy({
//   bindings: [
//     {
//       role: "roles/secretmanager.secretAccessor",
//       members: [
//         "serviceAccount:service-123456789@gcp-sa-cloudbuild.iam.gserviceaccount.com",
//       ],
//     },
//   ],
// });
// const policy = new gcp.secretmanager.SecretIamPolicy("policy", {
//   secretId: github_token_secret.secretId,
//   policyData: p4sa_secretAccessor.then(
//     (p4sa_secretAccessor) => p4sa_secretAccessor.policyData
//   ),
// });
const my_connection = new gcp.cloudbuildv2.Connection("my-connection", {
  location: "asia-northeast1",
  name: "my-connection",
  githubConfig: {
    // appInstallationId: 123123,
    authorizerCredential: {
      oauthTokenSecretVersion: github_token_secret.name,
      //   oauthTokenSecretVersion: github_token_secret.id,
    },
  },
});
const my_repository = new gcp.cloudbuildv2.Repository("my-repository", {
  location: "asia-northeast1",
  name: "my-repo",
  parentConnection: my_connection.name,
  remoteUri: "https://github.com/sendo-kakeru/pulumi-gcp-remix",
});

// const bbs_config = new gcp.cloudbuild.BitbucketServerConfig("image-gcs", {
//   configId: "image-gcs",
//   location: "asia-northeast1",
//   hostUri: "https://bbs.com",
//   secrets: {
//     adminAccessTokenVersionName:
//       "projects/myProject/secrets/mybbspat/versions/1",
//     readAccessTokenVersionName:
//       "projects/myProject/secrets/mybbspat/versions/1",
//     webhookSecretVersionName: "projects/myProject/secrets/mybbspat/versions/1",
//   },
//   username: "test",
//   apiKey: "<api-key>",
// });

const repo_trigger = new gcp.cloudbuild.Trigger("repo-trigger", {
  location: "asia-northeast1",
  repositoryEventConfig: {
    repository: my_repository.id,
    push: {
      branch: "main",
    },
  },
  //   bitbucketServerTriggerConfig: {
  //     repoSlug: "bbs-push-trigger",
  //     projectKey: "STAG",
  //     bitbucketServerConfigResource: bbs_config.id,
  //     push: {
  //       tag: "^0.1.*",
  //       invertRegex: true,
  //     },
  //   },
  filename: "cloudbuild.yaml",
});


// Define Cloud Run service
const cloudRunService = new gcp.cloudrun.Service("cloudRunService", {
  location: "asia-northeast1",
  template: {
    spec: {
      containers: [
        {
        //   image: repo_trigger.,
          image: "gcr.io/my-project/my-image:latest",
          envs: [
            {
              name: "DATABASE_URL",
              value: DATABASE_URL.secretData,
            },
          ],
        },
      ],
    },
  },
});

// Allow unauthenticated invocations
// const iam = new gcp.cloudrun.IamMember("cloudRunIam", {
//   service: cloudRunService.name,
//   location: cloudRunService.location,
//   role: "roles/run.invoker",
//   member: "allUsers",
// });
// // Create a secret in Secret Manager
// const secret = new gcp.secretmanager.Secret("my-secret", {
//   secretId: "my-secret",
//   replication: {},
// });

// // Add a secret version
// const secretVersion = new gcp.secretmanager.SecretVersion("my-secret-version", {
//   secret: secret.id,
//   secretData: "my-secret-value",
// });

// // IAM policy to allow Cloud Build to access the secret
// const secretIamPolicy = new gcp.secretmanager.SecretIamMember(
//   "my-secret-iam-member",
//   {
//     secretId: secret.id,
//     role: "roles/secretmanager.secretAccessor",
//     member:
//       "serviceAccount:my-cloud-build-service-account@gcp-sa-cloudbuild.iam.gserviceaccount.com",
//   }
// );

export const cloudRunUrl = cloudRunService.urn;
