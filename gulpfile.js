const gulp = require('gulp')
const minifyCss = require('gulp-cssmin')
const postcss = require('gulp-postcss')
const concat = require('gulp-concat')

const POSTCSS_PROCESSORS = [
    require('postcss-for')(),
    require('postcss-cssnext')()
]

const PATHS = {
    styles: [
        'leon.css',
        'style.next.css'
    ]
}

gulp.task('styles', function() {
    return gulp.src(PATHS.styles)
        .pipe(concat('style.min.css'))
        .pipe(postcss(POSTCSS_PROCESSORS))
        .pipe(minifyCss())
        .pipe(gulp.dest('./'))
})

gulp.task('watch', function() {
    gulp.watch(PATHS.styles, ['styles'])
})

gulp.task('build', ['styles'])

gulp.task('default', ['build', 'watch'])
