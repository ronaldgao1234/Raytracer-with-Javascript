// CS 174a Project 3 Ray Tracer Skeleton

function Ball( )
{                                 // *** Notice these data members. Upon construction, a Ball first fills them in with arguments:
  var members = [ "position", "size", "color", "k_a", "k_d", "k_s", "n", "k_r", "k_refract", "refract_index" ];
  for( i in arguments )    this[ members[ i ] ] = arguments[ i ];
  this.construct();
}

Ball.prototype.construct = function()
{
  // TODO:  Give Ball any other data members that might be useful, assigning them according to this Ball's this.position and this.size members.
  //scale

  //doing the inverse here would be optimal for performace. 
  //this.model_transform = mult( model_transform, scale(this.size));
  //set model transform equal to the inverse transform
  // var camera_inv = inverse( this.anim.graphicsState.camera_transform );
  //var temp = mat4();
  // temp = ()

  // this.model_transform = inverse();     
  
  //this.model_transform = mult( this.model_transform, translation(parseInt(this.position[0]), parseInt(this.position[1]), parseInt(this.position[2])  ) );
  // var temp = [
  //           vec4( 1.0, 0.0,  0.0,   parseFloat(this.position[0]) ),
  //           vec4( 0.0,  1.0, 0.0,   parseFloat(this.position[1]) ),
  //           vec4( 0.0,  0.0,  1.0,  parseFloat(this.position[2]) ),
  //           vec4( 0.0,  0.0,  0.0,  1.0 )
  //       ];
  //this.model_transform = mult( this.model_transform, translation(parseInt(this.position[0]), parseInt(this.position[1]), parseInt(this.position[2])  ) );
  //temp2 = mult( mat4(1), scale(parseFloat(this.size[0]), parseFloat(this.size[1]), parseFloat(this.size[2])));
  // this.model_transform = mult( scale(parseFloat(this.size[0]), parseFloat(this.size[1]), parseFloat(this.size[2]))
  //   , translation(parseFloat(this.position[0]), parseFloat(this.position[1]), parseFloat(this.position[2])  ) );
  
  //parseFloat error took forever
  this.inverseScaling = inverse(mult( mat4(1), scale(parseFloat(this.size[0]), parseFloat(this.size[1]), parseFloat(this.size[2]))));
  //omg, this took so long because I literally had no idea what model_trasnform was. holy moly
  this.model_transform = mult(translation(parseFloat(this.position[0]), parseFloat(this.position[1]), parseFloat(this.position[2])  ),
    scale(parseFloat(this.size[0]), parseFloat(this.size[1]), parseFloat(this.size[2])));
  //this.model_transform = temp2;

}

//goodbye thanksgiving break
Ball.prototype.intersect = function( ray, existing_intersection, minimum_dist )
{
  // TODO:  Given a ray, check if this Ball is in its path.  Recieves as an argument a record of the nearest intersection found 
  //        so far, updates it if needed and returns it.  Only counts intersections that are at least a given distance ahead along the ray.
  //        An interection object is assumed to store a Ball pointer, a t distance value along the ray, and a normal.
  
  //need to do inverse scaling on the ray and the primitive in order to get the right t
  var is = this.inverseScaling;
  var isInside = 0;

  //taking the inverse of the ray
  var c = mult_vec(is , ray.dir);
  i = parseFloat(this.position[0]);
  o = parseFloat(this.position[1]);
  p = parseFloat(this.position[2]);
  //solves unit sphere problem. You can't actually use the slide's equation without inverse transforming the ray first
  //this line took me forever. Instead of just inverse transforming the origin
  //we are inverse transofmring the displacement between the sphere origin and the ray origin
  //this will help us if the origin of the sphere is not at 0,0,0
  var S = mult_vec(is , subtract(vec4(i,o,p,1), ray.origin));
  
  //setup for quadratic equation
  var a1 = dot(c,c);
  var b1 = dot (S,c);
  //avoids the extra + 1 from doing vec4
  var tS = vec3(S[0],S[1],S[2]);
  var c1 = dot(tS,tS) - 1;
  
  //solve quadratic equation to get the amount of solutions we have
  var discrim = Math.pow(b1,2) - (a1*c1);

  //solution
  var t = 0 - 1;
  //if the solution is greater than 0.0001
  var farEnough = 0;

  //0 t -> do nothing since we don't have a solution
  if(discrim == 0){
    //one t. division more costly than multiply. should be b/2a but we mixed up the formula
    t = (1/a1) * b1;
    if(t > 0.00001)
      farEnough = 1;
  }else if (discrim > 0 ){
    //two t solutions if not 1. if 0 just do nothing
    var squareRoot = Math.sqrt(discrim);
    t1 = (b1 - squareRoot)* (1/a1);
    t2 = (b1 + squareRoot)* (1/a1);

    //get smaller of the two since that will be the first intersection
    if(t1 < t2)
      t = t1;
    else
      t = t2;

    //if the solutions is literally too small you want to take the other solution
    if(t <= 0.00001){ //not far enough
      
      //the sphere is cut by the near plane 
      isInside = 1;

      //take the other solution
      if(t == t1)
        t = t2;
      else
        t = t1;
    }
    else{
      //is far enough
      farEnough = 1;
    }
  }

  //only adjust if it is far enough
  if(farEnough == 1){
    //adjust if t is close than what we already have or it is the first one
    if(t < existing_intersection.distance || existing_intersection.distance == Number.POSITIVE_INFINITY){
        // existing_intersection.foundBall = 1;
        existing_intersection.distance = t;
        existing_intersection.ball = this;
    }
  }

  //if we have a solution
  if(existing_intersection.distance != Number.POSITIVE_INFINITY){
    var bPointer = existing_intersection.ball;
    //intersection point. S+ct
    var intersect_point = add(ray.origin, scale_vec(existing_intersection.distance, ray.dir));

    //need a normal
    var normal = vec4();
    //position of the sphere that we found hda the nearest intersection
    temp = vec4( bPointer.position[0], bPointer.position[1], bPointer.position[2], 1);
    normal = subtract(intersect_point, temp);

    //we want to flip the normal if inside
    if(isInside == 1)
      normal = scale_vec(-1, normal);

    //Piazza post about how to do transpose inverse of normal
    //because the "sphere" maybe be transformed, that would be fine but the normals will be too
    //in order to have the normals not "lean" torwards each other we have to straighten them out with 
    //transpose inverse 
    var trans = mat4();
    trans = transpose(existing_intersection.ball.inverseScaling);
    normal = mult_vec(trans,mult_vec(existing_intersection.ball.inverseScaling,normal));

    //need to normalize for later use. divide all vector edges by their lengths
    existing_intersection.normal = normalize(normal);
  }
  return existing_intersection;
}

var mult_3_coeffs = function( a, b ) { return [ a[0]*b[0], a[1]*b[1], a[2]*b[2] ]; };       // Convenient way to combine two color vectors

var background_functions = {                // These convert a ray into a color even when no balls were struck by the ray.
waves: function( ray, distance )
{
  return Color( .5 * Math.pow( Math.sin( 2 * ray.dir[0] ), 4 ) + Math.abs( .5 * Math.cos( 8 * ray.dir[0] + Math.sin( 10 * ray.dir[1] ) + Math.sin( 10 * ray.dir[2] ) ) ),
                .5 * Math.pow( Math.sin( 2 * ray.dir[1] ), 4 ) + Math.abs( .5 * Math.cos( 8 * ray.dir[1] + Math.sin( 10 * ray.dir[0] ) + Math.sin( 10 * ray.dir[2] ) ) ),
                .5 * Math.pow( Math.sin( 2 * ray.dir[2] ), 4 ) + Math.abs( .5 * Math.cos( 8 * ray.dir[2] + Math.sin( 10 * ray.dir[1] ) + Math.sin( 10 * ray.dir[0] ) ) ), 1 );
},
lasers: function( ray, distance ) 
{
  var u = Math.acos( ray.dir[0] ), v = Math.atan2( ray.dir[1], ray.dir[2] );
  return Color( 1 + .5 * Math.cos( Math.floor( 20 * u ) ), 1 + .5 * Math.cos( Math.floor( 20 * v ) ), 1 + .5 * Math.cos( Math.floor( 8 * u ) ), 1 );
},
mixture:       function( ray, distance ) { return mult_3_coeffs( background_functions["waves"]( ray, distance ), background_functions["lasers"]( ray, distance ) ).concat(1); },
ray_direction: function( ray, distance ) { return Color( Math.abs( ray.dir[ 0 ] ), Math.abs( ray.dir[ 1 ] ), Math.abs( ray.dir[ 2 ] ), 1 );  },
color:         function( ray, distance ) { return background_color;  }
};
var curr_background_function = "color";
var background_color = vec4( 0, 0, 0, 1 );

// *******************************************************
// Raytracer class - gets registered to the window by the Animation object that owns it
function Raytracer( parent )  
{
  var defaults = { width: 32, height: 32, near: 1, left: -1, right: 1, bottom: -1, top: 1, scanline: 0, visible: true, anim: parent, ambient: vec3( .1, .1, .1 ) };
  for( i in defaults )  this[ i ] = defaults[ i ];
  
  this.m_square = new N_Polygon( 4 );                   // For texturing with and showing the ray traced result
  this.m_sphere = new Subdivision_Sphere( 4, true );    // For drawing with ray tracing turned off
  
  this.balls = [];    // Array for all the balls
    
  initTexture( "procedural", true, true );      // Our texture for drawing the ray trace    
  textures["procedural"].image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"   // Blank gif file
  
  this.scratchpad = document.createElement('canvas');   // A hidden canvas for assembling the texture
  this.scratchpad.width  = this.width;
  this.scratchpad.height = this.height;
  
  this.scratchpad_context = this.scratchpad.getContext('2d');
  this.imageData          = new ImageData( this.width, this.height );     // Will hold ray traced pixels waiting to be stored in the texture
  
  this.make_menu();
}

Raytracer.prototype.toggle_visible = function() { this.visible = !this.visible; document.getElementById("progress").style = "display:inline-block;" };

Raytracer.prototype.make_menu = function()      // The buttons
{
  document.getElementById( "raytracer_menu" ).innerHTML = "<span style='white-space: nowrap'><button id='toggle_raytracing' class='dropbtn' style='background-color: #AF4C50'>Toggle Ray Tracing</button> \
                                                           <button onclick='document.getElementById(\"myDropdown2\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #8A8A4C'>Select Background Effect</button><div id='myDropdown2' class='dropdown-content'>  </div>\
                                                           <button onclick='document.getElementById(\"myDropdown\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #4C50AF'>Select Test Case</button><div id='myDropdown' class='dropdown-content'>  </div> \
                                                           <button id='submit_scene' class='dropbtn'>Submit Scene Textbox</button> \
                                                           <div id='progress' style = 'display:none;' ></div></span>";
  for( i in test_cases )
  {
    var a = document.createElement( "a" );
    a.addEventListener("click", ( function( i, self ) { return function() { load_case( i ); self.parseFile(); }; } )( i, this ), false);
    a.innerHTML = i;
    document.getElementById( "myDropdown" ).appendChild( a );
  }
  for( j in background_functions )
  {
    var a = document.createElement( "a" );
    a.addEventListener("click", ( function( j ) { return function() { curr_background_function = j; } } )( j ), false);
    a.innerHTML = j;
    document.getElementById( "myDropdown2" ).appendChild( a );
  }
  
  document.getElementById( "input_scene" ).addEventListener( "keydown", function(event) { event.cancelBubble = true; }, false );
  
  window.addEventListener( "click", function(event) {  if (!event.target.matches('.dropbtn')) {    
  document.getElementById( "myDropdown"  ).classList.remove("show");
  document.getElementById( "myDropdown2" ).classList.remove("show"); } }, false );

  document.getElementById( "toggle_raytracing" ).addEventListener("click", this.toggle_visible.bind( this ), false);
  document.getElementById( "submit_scene" ).addEventListener("click", this.parseFile.bind( this ), false);
}

Raytracer.prototype.getDir = function( ix, iy ) {
  
  // TODO:  Maps an (x,y) pixel to a corresponding xyz vector that reaches the near plane.  This function, once finished,
  //        will help cause everything under the "background functions" menu to start working. 

  //Preserve ratios of how to map the image to the near plane of the frustum
  var a = (ix)/this.width;
  var b = (iy)/this.height;

  //interpolate
  //This.left was actually coming in as a string so I had to use parseFloat so that it could add correctly. 
  var x = parseFloat(this.left) + a*(this.right - this.left);
  var y = parseFloat(this.bottom) + b*(this.top - this.bottom);
  // var x = -1 + a;
  // var y = -1 + b;

  //dir = x,y,-g-near,0
  return vec4( x, y, -this.near, 0 );    
}
  
Raytracer.prototype.trace = function( ray, color_remaining, shadow_test_light_source )
{
  // TODO:  Given a ray, return the color in that ray's path.  Could be originating from the camera itself or from a secondary reflection 
  //        or refraction off a ball.  Call Ball.prototype.intersect on each ball to determine the nearest ball struck, if any, and perform
  //        vector math (namely the Phong reflection formula) using the resulting intersection record to figure out the influence of light on 
  //        that spot.  
  //
  //        Arguments include some indicator of recursion level so you can cut it off after a few recursions.  Or, optionally,
  //        instead just store color_remaining, the pixel's remaining potential to be lit up more... proceeding only if that's still significant.  
  //        If a light source for shadow testing is provided as the optional final argument, this function's objective simplifies to just 
  //        checking the path directly to a light source for obstructions.
  

  //if the shadow_test_light_source is not undefined

  var closest_intersection  = 
  { distance: Number.POSITIVE_INFINITY, ball: this.balls[0], normal: vec4()};
  var i;
  
  for(i = 0; i < this.balls.length; i++){
    closest_intersection = this.balls[i].intersect(ray, closest_intersection);
  }
  //didn't find ball
  if(closest_intersection.distance == Number.POSITIVE_INFINITY){
   return mult_3_coeffs( this.ambient, background_functions[ curr_background_function ] ( ray ) ).concat(1); 
  //return background_color;
  }
  
  var final_color = vec4();
  //ambient
  ambient2 = vec3();
  ambient2 = scale_vec(closest_intersection.ball.k_a , this.ambient);

  //diffuse and specular
  var diffuse = vec3();
  var specular = vec3();
  var intersect_point = add(ray.origin, scale_vec(closest_intersection.distance, ray.dir)); //vec4

  //for every single light
  for( var j = 0; j < this.anim.graphicsState.lights.length; j++){
    var l = this.anim.graphicsState.lights[j];
    var lightRay = { origin: intersect_point, dir: normalize(subtract(l.position, 
      intersect_point))
    };
    var light_intersection  = 
    { distance: Number.POSITIVE_INFINITY, ball: this.balls[0], normal: vec4()};
    for(k = 0; k < this.balls.length; k++){
      light_intersection = this.balls[k].intersect(lightRay, light_intersection);
    }
    if(light_intersection.distance == Number.POSITIVE_INFINITY){
      var diffusionIntensity = dot(closest_intersection.normal, lightRay.dir);
      if(diffusionIntensity > 0 ){
        diffuse = add(diffuse, mult_3_coeffs(scale_vec(diffusionIntensity, l.color),
          closest_intersection.ball.color));

        var h = normalize(subtract(lightRay.dir, ray.dir));

        var specularIntensity = dot(closest_intersection.normal,h);
        specular = add(specular,scale_vec(Math.pow(Math.pow(specularIntensity, closest_intersection.ball.n),3),
         vec3(l.color[0],l.color[1],l.color[2])));
      }
    }
  }

  //don't forget ambient in color
  final_color = mult_3_coeffs(closest_intersection.ball.color, ambient2);
  final_color = add(final_color,scale_vec(closest_intersection.ball.k_d,diffuse));
  final_color = add(final_color,scale_vec(closest_intersection.ball.k_s, specular));

  var ffinal_color = vec4(final_color[0],final_color[1],final_color[2],1);
  //final_color = final_color + ...

  return ffinal_color;

  //if( length( color_remaining ) < .3 )    return Color( 0, 0, 0, 1 );  // Is there any remaining potential for brightening this pixel even more?

  // var closest_intersection = { distance: Number.POSITIVE_INFINITY }    // An empty intersection object
  
  // if( closest_intersection.foundBall == 0 )
  //   return mult_3_coeffs( this.ambient, background_functions[ curr_background_function ] ( ray ) ).concat(1);     
    // }
}

Raytracer.prototype.parseLine = function( tokens )            // Load the text lines into variables
{
  switch( tokens[0] )
    {
        case "NEAR":    this.near   = tokens[1];  break;
        case "LEFT":    this.left   = tokens[1];  break;
        case "RIGHT":   this.right  = tokens[1];  break;
        case "BOTTOM":  this.bottom = tokens[1];  break;
        case "TOP":     this.top    = tokens[1];  break;
        case "RES":     this.width  = tokens[1];  
                        this.height = tokens[2]; 
                        this.scratchpad.width  = this.width;
                        this.scratchpad.height = this.height; 
                        break;
        case "SPHERE":
          this.balls.push( new Ball( vec3( tokens[1], tokens[2], tokens[3] ), vec3( tokens[4], tokens[5], tokens[6] ), vec3( tokens[7], tokens[8], tokens[9] ), 
                             tokens[10], tokens[11], tokens[12], tokens[13], tokens[14], tokens[15], tokens[16] ) );
          break;
        case "LIGHT":
          this.anim.graphicsState.lights.push( new Light( vec4( tokens[1], tokens[2], tokens[3], 1 ), Color( tokens[4], tokens[5], tokens[6], 1 ), 100000 ) );
          break;
        case "BACK":     background_color = Color( tokens[1], tokens[2], tokens[3], 1 );  gl.clearColor.apply( gl, background_color ); break;
        case "AMBIENT":
          this.ambient = vec3( tokens[1], tokens[2], tokens[3] );          
    }
}

Raytracer.prototype.parseFile = function()        // Move through the text lines
{
  this.balls = [];   this.anim.graphicsState.lights = [];
  this.scanline = 0; this.scanlines_per_frame = 1;                            // Begin at bottom scanline, forget the last image's speedup factor
  document.getElementById("progress").style = "display:inline-block;";        // Re-show progress bar
  this.anim.graphicsState.camera_transform = mat4();                          // Reset camera
  var input_lines = document.getElementById( "input_scene" ).value.split("\n");
  for( var i = 0; i < input_lines.length; i++ ) this.parseLine( input_lines[i].split(/\s+/) );
}

Raytracer.prototype.setColor = function( ix, iy, color )        // Sends a color to one pixel value of our final result
{
  var index = iy * this.width + ix;
  this.imageData.data[ 4 * index     ] = 255.9 * color[0];    
  this.imageData.data[ 4 * index + 1 ] = 255.9 * color[1];    
  this.imageData.data[ 4 * index + 2 ] = 255.9 * color[2];    
  this.imageData.data[ 4 * index + 3 ] = 255;  
}

Raytracer.prototype.display = function(time)
{
  var desired_milliseconds_per_frame = 100;
  if( ! this.prev_time ) this.prev_time = 0;
  if( ! this.scanlines_per_frame ) this.scanlines_per_frame = 1;
  this.milliseconds_per_scanline = Math.max( ( time - this.prev_time ) / this.scanlines_per_frame, 1 );
  this.prev_time = time;
  this.scanlines_per_frame = desired_milliseconds_per_frame / this.milliseconds_per_scanline + 1;
  
  if( !this.visible )  {                         // Raster mode, to draw the same shapes out of triangles when you don't want to trace rays
    for( i in this.balls )
        this.m_sphere.draw( this.anim.graphicsState, this.balls[i].model_transform, new Material( this.balls[i].color.concat( 1 ), 
                                                                              this.balls[i].k_a, this.balls[i].k_d, this.balls[i].k_s, this.balls[i].n ) );
    this.scanline = 0;    document.getElementById("progress").style = "display:none";     return; }; 
  if( !textures["procedural"] || ! textures["procedural"].loaded ) return;      // Don't display until we've got our first procedural image
  
  this.scratchpad_context.drawImage(textures["procedural"].image, 0, 0 );
  this.imageData = this.scratchpad_context.getImageData(0, 0, this.width, this.height );    // Send the newest pixels over to the texture
  var camera_inv = inverse( this.anim.graphicsState.camera_transform );
   
  for( var i = 0; i < this.scanlines_per_frame; i++ )     // Update as many scanlines on the picture at once as we can, based on previous frame's speed
  {
    var y = this.scanline++;
    if( y >= this.height ) { this.scanline = 0; document.getElementById("progress").style = "display:none" };
    document.getElementById("progress").innerHTML = "Rendering ( " + 100 * y / this.height + "% )..."; 
    for ( var x = 0; x < this.width; x++ )
    {
      var ray = { origin: mult_vec( camera_inv, vec4( 0, 0, 0, 1 ) ), dir: mult_vec( camera_inv, this.getDir( x, y ) ) };   // Apply camera
      this.setColor( x, y, this.trace( ray, vec3( 1, 1, 1 ) ) );                                    // ******** Trace a single ray *********
    }
  }
  
  this.scratchpad_context.putImageData( this.imageData, 0, 0);                    // Draw the image on the hidden canvas
  textures["procedural"].image.src = this.scratchpad.toDataURL("image/png");      // Convert the canvas back into an image and send to a texture
  
  this.m_square.draw( new GraphicsState( mat4(), mat4(), 0 ), mat4(), new Material( Color( 0, 0, 0, 1 ), 1,  0, 0, 1, "procedural" ) );

  if( !this.m_text  ) { this.m_text  = new Text_Line( 45 ); this.m_text .set_string("Open some test cases with the blue button."); }
  if( !this.m_text2 ) { this.m_text2 = new Text_Line( 45 ); this.m_text2.set_string("Click and drag to steer."); }
  
  var model_transform = rotation( -90, vec3( 0, 1, 0 ) );                           
      model_transform = mult( model_transform, translation( .3, .9, .9 ) );
      model_transform = mult( model_transform, scale( 1, .075, .05) );
  
  this.m_text .draw( new GraphicsState( mat4(), mat4(), 0 ), model_transform, true, vec4(0,0,0, 1 - time/10000 ) );         
      model_transform = mult( model_transform, translation( 0, -1, 0 ) );
  this.m_text2.draw( new GraphicsState( mat4(), mat4(), 0 ), model_transform, true, vec4(0,0,0, 1 - time/10000 ) );   
}

Raytracer.prototype.init_keys = function()   {  shortcut.add( "SHIFT+r", this.toggle_visible.bind( this ) );  }

Raytracer.prototype.update_strings = function( debug_screen_object )    // Strings that this displayable object (Raytracer) contributes to the UI:
  { }