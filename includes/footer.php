</div>

    <!-- Enhanced Footer -->
    <footer class="glass-effect text-center py-4 mt-5" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); border-top: 1px solid rgba(255, 255, 255, 0.2);">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6 text-md-start">
                    <p class="text-white mb-0 fw-500">
                        &copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. All rights reserved.
                    </p>
                </div>
                <div class="col-md-6 text-md-end">
                    <small class="text-white-50">
                        <i class="fas fa-code me-1"></i>
                        Built with modern web technologies
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- JavaScript Dependencies -->
    <script>
        // jQuery fallback
        if (typeof jQuery === 'undefined') {
            document.write('<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"><\/script>');
        }
    </script>
    <script src="../assets/js/main.js"></script>

    <!-- Custom JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <?php if (isset($include_timer) && $include_timer): ?>
        <script src="../assets/js/timer.js"></script>
    <?php endif; ?>

    <script>
        // Hide loading overlay when page is fully loaded
        $(document).ready(function() {
            $('#loadingOverlay').removeClass('show');
        });

        // Show loading overlay for page transitions
        $('a:not([href^="#"]):not([href^="javascript:"]):not([data-bs-toggle])').on('click', function() {
            if (this.hostname === window.location.hostname) {
                $('#loadingOverlay').addClass('show');
            }
        });

        // Form submission loading
        $('form').on('submit', function() {
            $('#loadingOverlay').addClass('show');
        });

        // Enhanced tooltips and popovers
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });

        // Auto-hide alerts after 5 seconds
        $('.alert:not(.alert-permanent)').each(function() {
            var alert = $(this);
            setTimeout(function() {
                alert.fadeOut(500);
            }, 5000);
        });

        // Add smooth scroll behavior
        $('a[href^="#"]').on('click', function(e) {
            e.preventDefault();
            var target = $(this.getAttribute('href'));
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 100
                }, 500);
            }
        });
    </script>
</body>
</html>