var projectInitiate = function(){

//project navbar shrink
var lastScrollTop;

        navbar = document.querySelector('.project-navbar-web');

        window.addEventListener('scroll', function() {
            //on every scroll this funtion will be called

            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            //This line will get the location on scroll

            if (scrollTop > lastScrollTop) { //if it will be greater than the previous
                navbar.style.top = '-80px';
                

            } else {
                navbar.style.top = '0px';
            }

            lastScrollTop = scrollTop;
            
        });



//hamburger menu

        const menuBtn = document.querySelector('.menu-btn');
        let menuOpen = false;
        menuBtn.addEventListener('click', () => {
            if (!menuOpen) {
                menuBtn.classList.add('open');
                menuOpen = true;
            } else {
                menuBtn.classList.remove('open');
                menuOpen = false;
            }
        });


//???
        $(document).ready(function() {

            $("a").on('click', function(event) {


                if (this.hash !== "") {

                    event.preventDefault();


                    var hash = this.hash;

                    $('html, body').animate({
                        scrollTop: $(hash).offset().top
                    }, 800, function() {

                        window.location.hash = hash;
                    });
                }
            });
        });
    
     //page transition image change 
         var image_array = ['img/1.png', 'img/2.png', 'img/3.png', 'img/4.png', 'img/5.png', 'img/6.png']
  
  $("#changeBtn").click(function(){
      random_index = Math.floor(Math.random() * image_array.length);
      
      selected_image = image_array[random_index];
      
      document.getElementById('randomimg').src = selected_image;
      
      console.log("change");
      
  })

};





         $(document).ready(function() {
             initiate();
            
        });
