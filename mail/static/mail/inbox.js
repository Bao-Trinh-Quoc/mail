let current_mailbox = 'inbox';

document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // For the compose form submission
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  current_mailbox = mailbox;
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  
  // Fetch emails 
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            const email_div = document.createElement('div');
            email_div.className = 'email-item';
            email_div.style.border = '1px solid #ccc';
            email_div.style.padding = '10px';
            email_div.style.margin = '5px 0';
            email_div.style.cursor = 'pointer';
            email_div.style.backgroundColor = email.read ? '#e9ecef' : 'white';

            // The content of email
            // Sender
            const sender_span = document.createElement('span');
            sender_span.style.fontWeight = 'bold';
            sender_span.textContent = email.sender;

            // Subject
            const subject_span = document.createElement('span');
            subject_span.style.marginLeft = '10px';
            subject_span.textContent = email.subject;

            // Time stamp
            const timestamp_span = document.createElement('span');
            timestamp_span.style.float = 'right';
            timestamp_span.textContent = email.timestamp;

            email_div.appendChild(sender_span);
            email_div.appendChild(subject_span);
            email_div.appendChild(timestamp_span);
            
            email_div.addEventListener('click', () => view_email(email.id));
           

            document.querySelector('#emails-view').appendChild(email_div);
        });
    });
}

function show_email_view() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
}

function send_email(event) {
  // Prevent default form submission
  event.preventDefault();

  // Get form data
  const recipients =  document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);

      if (result.message === "Email sent successfully.") {
        load_mailbox('sent');
      } else {
        alert(result.error);
      }
  });
}

function view_email(email_id) {
  show_email_view();

  const email_view = document.querySelector('#email-view');
  email_view.innerHTML = 'Loading...';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        if (!email.read) {
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({ read: true})
          });
        }
      
      email_view.innerHTML = '';
      const fields = [
        ['From', email.sender],
        ['To', email.recipients.join(', ')],
        ['Subject', email.subject],
        ['Timestamp', email.timestamp]
      ];
      fields.forEach(([label, value]) => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${label}:</strong> ${value}`;
        email_view.appendChild(div);
      });

      const hr = document.createElement('hr');
      email_view.appendChild(hr);

      const body_div = document.createElement('div');
      body_div.textContent = email.body;
      email_view.appendChild(body_div);

      // Archive/Unarchive button logic
      if (current_mailbox !== 'sent') {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-outline-primary mt-2';

        if (email.archived) {
          // Show Unarchive button
          button.textContent = 'Unarchive';
          button.onclick = function() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({ archived: false })
            })
            .then(() => load_mailbox('inbox'));
          };
        } else {
          // Show archive button
          button.textContent = 'Archive';
          button.onclick = function() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({ archived: true })
            })
            .then(() => load_mailbox('inbox'));
          };
        }

        email_view.appendChild(document.createElement('hr'));
        email_view.appendChild(button);
      }
    });

}