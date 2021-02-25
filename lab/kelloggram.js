let db = firebase.firestore()

// Change main event listener from DOMContentLoaded to 
// firebase.auth().onAuthStateChanged and move code that 
// shows login UI to only show when signed out
firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    // Signed in
    console.log('signed in')

    // Ensure the signed-in user is in the users collection
    db.collection('users').doc(user.uid).set({
      name: user.displayName,
      email: user.email
    })

    // Sign-out button
    document.querySelector('.sign-in-or-sign-out').innerHTML = `
      <button class="text-pink-500 underline sign-out">Sign Out</button>
    `
    document.querySelector('.sign-out').addEventListener('click', function(event) {
      console.log('sign out clicked')
      firebase.auth().signOut()
      document.location.href = 'kelloggram.html'
    })

    // Listen for the form submit and create/render the new post
    document.querySelector('form').addEventListener('submit', async function(event) {
      event.preventDefault()
      let postUsername = document.querySelector('#username').value
      let postImageUrl = document.querySelector('#image-url').value
      let postNumberOfLikes = 0
      let docRef = await db.collection('posts').add({ 
        username: postUsername, 
        imageUrl: postImageUrl, 
        likes: 0,
        created: firebase.firestore.FieldValue.serverTimestamp()
      })
      let postId = docRef.id // the newly created document's ID
      renderPost(postId, postUsername, postImageUrl, postNumberOfLikes)
    })

    // Render all posts when the page is loaded
    let querySnapshot = await db.collection('posts').orderBy('created').get()
    let posts = querySnapshot.docs
    for (let i=0; i<posts.length; i++) {
      let postId = posts[i].id
      let postData = posts[i].data()
      let postUsername = postData.username
      let postImageUrl = postData.imageUrl
      let postNumberOfLikes = postData.likes
      renderPost(postId, postUsername, postImageUrl, postNumberOfLikes)
    }

  } else {
    // Signed out
    console.log('signed out')

    // Hide the form when signed-out
    document.querySelector('form').classList.add('hidden')

    // Initializes FirebaseUI Auth
    let ui = new firebaseui.auth.AuthUI(firebase.auth())

    // FirebaseUI configuration
    let authUIConfig = {
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      signInSuccessUrl: 'kelloggram.html'
    }

    // Starts FirebaseUI Auth
    ui.start('.sign-in-or-sign-out', authUIConfig)
  }
})

async function renderPost(postId, postUsername, postImageUrl, postNumberOfLikes) {
  document.querySelector('.posts').insertAdjacentHTML('beforeend', `
    <div class="post-${postId} md:mt-16 mt-8 space-y-8">
      <div class="md:mx-0 mx-4">
        <span class="font-bold text-xl">${postUsername}</span>
      </div>
  
      <div>
        <img src="${postImageUrl}" class="w-full">
      </div>
  
      <div class="text-3xl md:mx-0 mx-4">
        <button class="like-button">❤️</button>
        <span class="likes">${postNumberOfLikes}</span>
      </div>
    </div>
  `)
  document.querySelector(`.post-${postId} .like-button`).addEventListener('click', async function(event) {
    event.preventDefault()
    console.log(`post ${postId} like button clicked!`)
    let existingNumberOfLikes = document.querySelector(`.post-${postId} .likes`).innerHTML
    let newNumberOfLikes = parseInt(existingNumberOfLikes) + 1
    document.querySelector(`.post-${postId} .likes`).innerHTML = newNumberOfLikes
    await db.collection('posts').doc(postId).update({
      likes: firebase.firestore.FieldValue.increment(1)
    })
  })
}

// Goals: Eliminate the "username" field from the new posts form and,
// users should only be able to "like" a post once.

// Method: Refactor the existing domain model (see ../images/domain-model-kelloggram.png)

// Step 1: In the Firebase Console, delete the existing posts collection if one exists
// Step 2: Remove the username from the form, replace with the current user's name
// Step 3: "Liking" should add a new "likes" document in Firestore with the post ID 
//         and current user ID
// Step 4: "Liking" should only be allowed once per user per post – check for an 
//         existing "like" before adding a new "likes" document, i.e. get() the likes 
//         collection and filter by postId and userId, and ask for the .size Tip: 
//         you can combine .where() methods, for example:
//         db.collection('likes').where('postId', '==', postId).where('userId', '==', userId).get()
// Step 5: The code to increment the number of likes in the UI when the like button 
//         is clicked should be inside the conditional logic written in Step 4
// Step 6: Get the actual number of likes from Firestore for each post when the
//         page is loaded, using a .get() with .where() conditions and asking for
//         the .size